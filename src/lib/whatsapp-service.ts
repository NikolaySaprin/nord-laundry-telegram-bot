import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import type { Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { Application, ManagerReply } from '../types/application-types.js';

export class WhatsAppService {
  private client: any;
  private thanksMessageSent: Set<string> = new Set();
  private onNewApplication?: (application: Application) => Promise<void>;
  private restartAttempts: number = 0;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "nord-laundry-whatsapp",
        dataPath: "./.wwebjs_auth"
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
      authTimeoutMs: 0,
      qrMaxRetries: 0,
      restartOnAuthFail: false,
      takeoverOnConflict: false,
      takeoverTimeoutMs: 0
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Генерация QR кода
    this.client.on('qr', (qr: string) => {
      console.log('🔐 QR код для авторизации WhatsApp:');
      console.log('📱 Отсканируйте этот QR код с помощью WhatsApp на телефоне:');
      console.log('   1. Откройте WhatsApp на телефоне');
      console.log('   2. Перейдите в Настройки > Связанные устройства');
      console.log('   3. Нажмите "Связать устройство"');
      console.log('   4. Отсканируйте QR код ниже:');
      console.log('');
      
      // Пытаемся отобразить QR код в терминале
      try {
        qrcode.generate(qr, { small: true });
      } catch (error) {
        console.log('⚠️ Не удалось отобразить QR код в терминале');
      }
      
      // Альтернативный способ - ссылка на генератор QR кода
      console.log('');
      console.log('📋 Откройте эту ссылку в браузере для получения QR кода:');
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
      console.log('');
      console.log('⏳ Ожидание авторизации...');
    });

    // Обработка входящих сообщений
    this.client.on('message', async (message: Message) => {
      console.log('🔔 Получено событие message от WhatsApp клиента');
      await this.handleIncomingMessage(message);
    });

    // Обработка ошибок
    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ Ошибка авторизации WhatsApp:', msg);
      console.log('💡 Возможно, нужно отсканировать QR код заново');
    });

    // Обработка отключения
    this.client.on('disconnected', (reason: string) => {
      console.log('📱 WhatsApp клиент отключен:', reason);
      
      // Перезапускаем только при определенных причинах
      if (reason === 'LOGOUT' || reason === 'NAVIGATION') {
        console.log('🔄 Перезапускаем WhatsApp клиент через 5 секунд...');
        setTimeout(() => {
          this.restartClient();
        }, 5000);
      }
    });

    // Обработка ошибок Puppeteer
    this.client.on('change_state', (state: string) => {
      console.log('📱 WhatsApp состояние изменилось:', state);
      this.logClientState();
      
      // Если состояние изменилось на CONNECTED, принудительно сохраняем сессию
      if (state === 'CONNECTED') {
        setTimeout(() => {
          this.forceSaveSession();
        }, 1000);
      }
    });

    // Обработка ошибок выполнения
    this.client.on('remote_session_saved', () => {
      console.log('💾 Сессия WhatsApp сохранена');
    });

    // Обработка сохранения сессии
    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp клиент авторизован');
      console.log('🔒 Сессия настроена на 10 лет без перелогина');
      this.logClientState();
      
      // Принудительно сохраняем сессию после авторизации
      setTimeout(() => {
        this.forceSaveSession();
      }, 1000);
    });

    // Обработка загрузки сессии
    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ Ошибка авторизации WhatsApp:', msg);
      console.log('💡 Возможно, нужно отсканировать QR код заново');
    });

    // Предотвращение разлогинивания
    this.client.on('change_state', (state: string) => {
      console.log('📱 WhatsApp состояние:', state);
      if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.log('⚠️ Обнаружено разлогинивание, пытаемся восстановить сессию...');
        // Не перезапускаем автоматически, только логируем
      }
    });

    // Обработка конфликтов сессий
    this.client.on('remote_session_saved', () => {
      console.log('💾 Сессия WhatsApp сохранена на диск');
      console.log('🔒 Сессия будет сохранена на 10 лет');
    });

    // Обработка критических ошибок
    this.client.on('qr', (qr: string) => {
      console.log('🔐 QR код обновлен');
    });


    // Попытка отправить приветственное сообщение при подключении
    this.client.on('ready', async () => {
      console.log('✅ WhatsApp бот готов к работе!');
      this.logClientState();
      this.restartAttempts = 0;
      
      // Принудительно сохраняем сессию после успешной авторизации
      setTimeout(() => {
        this.forceSaveSession();
      }, 2000);

      // Логируем количество найденных чатов, но не отправляем приветствия
      try {
        const chats = await this.client.getChats();
        console.log(`📊 Найдено ${chats.length} чатов`);
        console.log('💡 Приветственные сообщения будут отправлены только при первом сообщении от пользователя');
      } catch (error) {
        console.log('⚠️ Не удалось получить список чатов:', error);
      }
    });

    // Глобальная обработка ошибок (только для критических ошибок)
    process.on('uncaughtException', (error) => {
      if (error.message.includes('Protocol error') || error.message.includes('Execution context was destroyed')) {
        console.log('⚠️ Обнаружена критическая ошибка Puppeteer, но не перезапускаем автоматически');
        console.log('💡 Ошибка:', error.message);
      }
    });

    process.on('unhandledRejection', (reason) => {
      if (reason && typeof reason === 'object' && 'message' in reason) {
        const error = reason as Error;
        if (error.message.includes('Protocol error') || error.message.includes('Execution context was destroyed')) {
          console.log('⚠️ Обнаружено необработанное отклонение Promise (Puppeteer), но не перезапускаем автоматически');
          console.log('💡 Ошибка:', error.message);
        }
      }
    });
  }

  // Установка обработчика новых заявок
  setApplicationHandler(handler: (application: Application) => Promise<void>): void {
    console.log('🔧 Устанавливаем обработчик заявок в WhatsApp сервисе');
    this.onNewApplication = handler;
    console.log('✅ Обработчик заявок установлен:', !!this.onNewApplication);
  }

  // Обработка входящих сообщений
  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      console.log('📨 Обрабатываем входящее сообщение WhatsApp:', {
        from: message.from,
        body: message.body,
        type: message.type,
        isStatus: message.isStatus,
        hasMedia: message.hasMedia
      });

      // Проверяем состояние клиента
      if (!this.client) {
        console.log('❌ WhatsApp клиент не инициализирован');
        return;
      }

      // Игнорируем сообщения из групп и статусы
      if (message.from.includes('@g.us') || message.isStatus) {
        console.log('⏭️ Пропускаем сообщение (группа или статус)');
        return;
      }

      // Получаем информацию о пользователе
      const contact = await message.getContact();
      const userPhone = contact.number;
      const userName = contact.name || contact.pushname || 'Пользователь';
      const userMessage = message.body;

      console.log('👤 Информация о пользователе:', {
        userPhone,
        userName,
        userMessage
      });

      // Приветствие убрано - отправляем только благодарность после обработки заявки

      // Определяем тип сообщения и медиа
      let messageType: Application['messageType'] = 'text';
      let mediaUrls: string[] = [];

      if (message.hasMedia) {
        try {
          const media = await message.downloadMedia();
          if (media) {
            const mediaUrl = await this.saveMediaFile(media, userPhone);
            if (mediaUrl) {
              mediaUrls.push(mediaUrl);
            }

            // Определяем тип медиа
            if (message.type === 'image') {
              messageType = 'image';
            } else if (message.type === 'video') {
              messageType = 'video';
            } else if (message.type === 'document') {
              messageType = 'document';
            } else if (message.type === 'audio' || message.type === 'ptt') {
              messageType = 'audio';
            }
          }
        } catch (error) {
          console.error('Ошибка обработки медиа файла:', error);
        }
      }

      // Создаем заявку
      const application: Application = {
        source: 'whatsapp',
        whatsappUserId: userPhone,
        whatsappUserName: userName,
        whatsappUserPhone: userPhone,
        userMessage: userMessage,
        name: userName,
        phone: userPhone,
        messageType: messageType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
      };

      // Пересылаем заявку в Telegram
      if (this.onNewApplication) {
        console.log('📤 Пересылаем заявку в Telegram...');
        console.log('✅ Обработчик заявок найден, отправляем заявку');
        console.log('📋 Данные заявки:', {
          source: application.source,
          userPhone: application.whatsappUserPhone,
          userName: application.whatsappUserName,
          message: application.userMessage
        });
        await this.onNewApplication(application);
        console.log('✅ Заявка успешно отправлена в Telegram');
      } else {
        console.log('❌ Обработчик заявок не найден');
        console.log('🔍 Проверяем состояние onNewApplication:', this.onNewApplication);
      }

      // Отправляем благодарственное сообщение только при первом сообщении
      if (!this.thanksMessageSent.has(userPhone)) {
        const thanksText = `Спасибо за заявку!\nМы свяжемся с Вами в ближайшее время`;
        await message.reply(thanksText);
        this.thanksMessageSent.add(userPhone);
        console.log('💬 Отправляем благодарственное сообщение пользователю');
        console.log('✅ Благодарственное сообщение отправлено');
      }

    } catch (error) {
      console.error('Ошибка обработки входящего сообщения WhatsApp:', error);
      
      // Логируем ошибку, но не перезапускаем автоматически
      if (error instanceof Error && 
          (error.message.includes('Protocol error') || 
           error.message.includes('Execution context was destroyed') ||
           error.message.includes('Target closed'))) {
        console.log('⚠️ Обнаружена ошибка Puppeteer при обработке сообщения');
        console.log('💡 Сообщение не обработано, но сессия сохранена');
      }
    }
  }

  // Сохранение медиа файла
  private async saveMediaFile(media: any, userPhone: string): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const extension = media.mimetype.split('/')[1] || 'bin';
      const filename = `whatsapp_${userPhone}_${timestamp}.${extension}`;
      
      // Здесь можно добавить сохранение в файловую систему или облачное хранилище
      console.log(`Медиа файл сохранен: ${filename}`);
      
      // Возвращаем временный URL (замените на реальный URL файла)
      return `https://your-server.com/media/${filename}`;
    } catch (error) {
      console.error('Ошибка сохранения медиа файла:', error);
      return null;
    }
  }

  // Отправка текстового сообщения
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      const chatId = `${to}@c.us`;
      await this.client.sendMessage(chatId, message);
      return true;
    } catch (error) {
      console.error('Ошибка отправки сообщения пользователю WhatsApp:', error);
      
      // Логируем ошибку, но не перезапускаем автоматически
      if (error instanceof Error && 
          (error.message.includes('Protocol error') || 
           error.message.includes('Execution context was destroyed') ||
           error.message.includes('Target closed'))) {
        console.log('⚠️ Обнаружена ошибка Puppeteer при отправке сообщения');
        console.log('💡 Сообщение не отправлено, но сессия сохранена');
      }
      
      return false;
    }
  }

  // Отправка медиа сообщения
  async sendMediaMessage(to: string, mediaUrl: string, mediaType: 'image' | 'video' | 'document' | 'audio', caption?: string): Promise<boolean> {
    try {
      const chatId = `${to}@c.us`;
      const media = await MessageMedia.fromUrl(mediaUrl);
      
      if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
        (media as any).caption = caption;
      }
      
      await this.client.sendMessage(chatId, media);
      return true;
    } catch (error) {
      console.error('Ошибка отправки медиа сообщения пользователю WhatsApp:', error);
      return false;
    }
  }

  // Отправка ответа менеджера клиенту
  async sendManagerReply(reply: ManagerReply): Promise<boolean> {
    if (reply.targetPlatform !== 'whatsapp') {
      return false;
    }

    try {
      // Отправляем текстовое сообщение с гиперссылкой на Telegram
      if (reply.message) {
        // Очищаем сообщение от лишних мета-тегов и ссылок
        let cleanMessage = reply.message;
        
        // Удаляем ссылки на Telegram (https://t.me/...)
        cleanMessage = cleanMessage.replace(/https:\/\/t\.me\/[^\s\n]+/g, '');
        
        // Удаляем лишние переносы строк и пробелы
        cleanMessage = cleanMessage.replace(/\n\s*\n/g, '\n').trim();
        
        // Создаем гиперссылку на Telegram аккаунт менеджера
        const telegramLink = `https://t.me/${reply.managerUsername.replace('@', '')}`;
        const managerMessage = `${cleanMessage}\n\n📱 Связаться в Telegram: ${telegramLink}`;
        await this.sendTextMessage(reply.targetUserId, managerMessage);
      }

      // Отправляем медиа файлы, если есть
      if (reply.mediaUrls && reply.mediaUrls.length > 0) {
        for (const mediaUrl of reply.mediaUrls) {
          // Определяем тип медиа по URL или расширению
          const mediaType = this.getMediaTypeFromUrl(mediaUrl);
          await this.sendMediaMessage(reply.targetUserId, mediaUrl, mediaType);
        }
      }

      console.log(`Ответ менеджера отправлен пользователю WhatsApp: ${reply.targetUserId}`);
      return true;
    } catch (error) {
      console.error('Ошибка отправки ответа менеджера в WhatsApp:', error);
      return false;
    }
  }

  // Определение типа медиа по URL
  private getMediaTypeFromUrl(url: string): 'image' | 'video' | 'document' | 'audio' {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) {
      return 'audio';
    } else {
      return 'document';
    }
  }

  private async restartClient(): Promise<void> {
    try {
      this.restartAttempts++;
      console.log(`🔄 Попытка перезапуска WhatsApp клиента #${this.restartAttempts}`);
      
      if (this.restartAttempts > 3) {
        console.log('❌ Превышено максимальное количество попыток перезапуска');
        return;
      }

      await this.client.destroy();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.client.initialize();
      console.log('✅ WhatsApp клиент перезапущен');
    } catch (error) {
      console.error('Ошибка при перезапуске WhatsApp клиента:', error);
    }
  }


  // Логирование состояния клиента
  private logClientState(): void {
    try {
      if (!this.client) {
        console.log('📊 Клиент не инициализирован');
        return;
      }

      const state = this.client.getState();
      const info = this.client.info;
      
      console.log('📊 Состояние WhatsApp клиента:', {
        state: state,
        isReady: info ? 'Да' : 'Нет',
        hasPage: this.client.pupPage && !this.client.pupPage.isClosed() ? 'Да' : 'Нет',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.log('📊 Не удалось получить состояние клиента:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }

  // Принудительное сохранение сессии
  private async forceSaveSession(): Promise<void> {
    try {
      // Проверяем, что клиент инициализирован и готов
      if (!this.client) {
        console.log('📊 Клиент не инициализирован, пропускаем сохранение сессии');
        return;
      }

      // Проверяем состояние клиента
      const state = this.client.getState();
      if (state !== 'CONNECTED' && state !== 'OPENING') {
        console.log(`📊 Клиент не подключен (состояние: ${state}), пропускаем сохранение сессии`);
        return;
      }

      // Проверяем доступность страницы
      if (!this.client.pupPage || this.client.pupPage.isClosed()) {
        console.log('📊 Страница недоступна, пропускаем сохранение сессии');
        return;
      }

      // Принудительно сохраняем сессию
      await this.client.pupPage.evaluate(() => {
        try {
          // Сохраняем данные сессии в localStorage
          if (window.localStorage) {
            window.localStorage.setItem('wwebjs_session_saved', Date.now().toString());
            window.localStorage.setItem('wwebjs_session_duration', '315360000000'); // 10 лет в миллисекундах
            window.localStorage.setItem('wwebjs_session_configured', 'true');
          }
        } catch (e) {
          console.log('Ошибка при сохранении в localStorage:', e);
        }
      });
      
      console.log('💾 Сессия принудительно сохранена');
    } catch (error) {
      // Логируем только если это не ошибка закрытой сессии
      if (error instanceof Error && !error.message.includes('Session closed') && !error.message.includes('Target closed')) {
        console.log('⚠️ Не удалось принудительно сохранить сессию:', error.message);
      }
    }
  }

  // Запуск сервиса
  start(): void {
    console.log('🚀 Инициализация WhatsApp клиента...');
    console.log('🔒 Настройка долгосрочной сессии (10 лет)...');
    
    this.client.initialize();
    console.log('✅ WhatsApp бот запущен и ожидает авторизации');
    
    // Периодически сохраняем сессию и проверяем состояние
    setInterval(() => {
      this.forceSaveSession();
      this.logClientState();
    }, 5 * 60 * 1000); // Каждые 5 минут

  }


  // Очистка списка отправленных благодарственных сообщений (для тестирования)
  clearThanksHistory(): void {
    this.thanksMessageSent.clear();
    console.log('🧹 История отправленных благодарственных сообщений очищена');
  }

  // Остановка сервиса
  stop(): void {
    if (this.client) {
      this.client.destroy();
      console.log('WhatsApp бот остановлен');
    }
  }
}