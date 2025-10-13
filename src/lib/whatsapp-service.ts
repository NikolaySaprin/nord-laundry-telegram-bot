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
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--disable-logging',
          '--disable-permissions-api',
          '--disable-presentation-api',
          '--disable-print-preview',
          '--disable-speech-api',
          '--disable-file-system',
          '--disable-notifications',
          '--disable-background-networking',
          '--disable-component-extensions-with-background-pages',
          '--disable-ipc-flooding-protection',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        timeout: 60000,
        ignoreDefaultArgs: ['--disable-extensions'],
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      },
      // Настройки для долгосрочной сессии (10 лет)
      authTimeoutMs: 0, // Без ограничения времени авторизации
      qrMaxRetries: 0, // Не ограничиваем количество попыток QR
      restartOnAuthFail: false, // Не перезапускаем при ошибке авторизации
      takeoverOnConflict: false, // Не захватываем конфликтующие сессии
      takeoverTimeoutMs: 0 // Без ограничения времени захвата
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Проверяем существующую сессию перед показом QR кода
    this.client.on('loading_screen', (percent: number, message: string) => {
      console.log(`📱 Загрузка WhatsApp сессии: ${percent}% - ${message}`);
    });

    // Генерация QR кода только если нет сохраненной сессии
    this.client.on('qr', (qr: string) => {
      console.log('🔐 QR код для авторизации WhatsApp:');
      console.log('⚠️  ВНИМАНИЕ: Это означает, что сохраненная сессия недействительна');
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
      
      // Перезапускаем при любом отключении, кроме LOGOUT
      if (reason !== 'LOGOUT') {
        console.log('🔄 Перезапускаем WhatsApp клиент через 3 секунды...');
        setTimeout(() => {
          this.restartClient();
        }, 3000);
      } else {
        console.log('⚠️ Произошел выход из аккаунта, требуется повторная авторизация');
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
      
      // Если состояние изменилось на UNPAIRED, пытаемся восстановить
      if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.log('⚠️ Обнаружено разлогинивание, пытаемся восстановить сессию...');
        setTimeout(() => {
          this.restartClient();
        }, 5000);
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
      
      // Создаем архив для переноса на VPS
      setTimeout(() => {
        this.createAuthArchive();
      }, 3000);
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
      
      // Проверяем, что обработчик заявок установлен
      if (!this.onNewApplication) {
        console.log('⚠️ Обработчик заявок не установлен после готовности клиента');
      } else {
        console.log('✅ Обработчик заявок активен и готов к работе');
      }
      
      // Принудительно сохраняем сессию после успешной авторизации
      setTimeout(() => {
        this.forceSaveSession();
      }, 2000);
      
      // Создаем архив для переноса на VPS
      setTimeout(() => {
        this.createAuthArchive();
      }, 5000);

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
      if (error.message.includes('Protocol error') || error.message.includes('Execution context was destroyed') || error.message.includes('Session closed')) {
        console.log('⚠️ Обнаружена критическая ошибка Puppeteer, пытаемся восстановить сессию...');
        console.log('💡 Ошибка:', error.message);
        
        // Пытаемся перезапустить клиент при критических ошибках
        setTimeout(() => {
          this.restartClient();
        }, 10000);
      }
    });

    process.on('unhandledRejection', (reason) => {
      if (reason && typeof reason === 'object' && 'message' in reason) {
        const error = reason as Error;
        if (error.message.includes('Protocol error') || error.message.includes('Execution context was destroyed') || error.message.includes('Session closed')) {
          console.log('⚠️ Обнаружено необработанное отклонение Promise (Puppeteer), пытаемся восстановить сессию...');
          console.log('💡 Ошибка:', error.message);
          
          // Пытаемся перезапустить клиент при критических ошибках
          setTimeout(() => {
            this.restartClient();
          }, 10000);
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

      // Игнорируем служебные сообщения WhatsApp
      const serviceMessageTypes = [
        'e2e_notification',
        'notification_template', 
        'call_log',
        'system',
        'protocol',
        'presence',
        'read_receipt',
        'revoked',
        'ephemeral',
        'notification'
      ];

      if (serviceMessageTypes.includes(message.type)) {
        console.log(`⏭️ Пропускаем служебное сообщение типа: ${message.type}`);
        return;
      }

      // Игнорируем пустые сообщения (кроме медиа)
      if (!message.body && !message.hasMedia) {
        console.log('⏭️ Пропускаем пустое сообщение');
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
        
        // Удаляем упоминания пользователей (@username)
        cleanMessage = cleanMessage.replace(/@[a-zA-Z0-9_]+/g, '');
        
        // Удаляем ID сообщений и другие мета-данные
        cleanMessage = cleanMessage.replace(/\[[^\]]+\]/g, '');
        cleanMessage = cleanMessage.replace(/\([^)]*message[^)]*\)/gi, '');
        cleanMessage = cleanMessage.replace(/\([^)]*thread[^)]*\)/gi, '');
        
        // Удаляем лишние переносы строк и пробелы
        cleanMessage = cleanMessage.replace(/\n\s*\n/g, '\n').trim();
        cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();
        
        // Удаляем пустые строки в начале и конце
        cleanMessage = cleanMessage.replace(/^\s*\n+|\n+\s*$/g, '');
        
        // Если сообщение стало пустым после очистки, используем стандартный текст
        if (!cleanMessage || cleanMessage.length < 2) {
          cleanMessage = 'Ответ от менеджера';
        }
        
        // Создаем гиперссылку на Telegram аккаунт менеджера
        const telegramLink = `https://t.me/${reply.managerUsername.replace('@', '')}`;
        const managerMessage = `${cleanMessage}\n\n📱 Связаться в Telegram: ${telegramLink}`;
        await this.sendTextMessage(reply.targetUserId, managerMessage);
      }

      // Отправляем медиа файлы, если есть (исключаем аватарки и служебные изображения)
      if (reply.mediaUrls && reply.mediaUrls.length > 0) {
        for (const mediaUrl of reply.mediaUrls) {
          // Пропускаем аватарки и служебные изображения
          if (this.isServiceImage(mediaUrl)) {
            console.log('⏭️ Пропускаем служебное изображение:', mediaUrl);
            continue;
          }
          
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

  // Проверка, является ли изображение служебным (аватарка, иконка и т.д.)
  private isServiceImage(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    
    // Проверяем размеры файла в URL (обычно аватарки маленькие)
    const sizeMatch = url.match(/[?&]size=(\d+)/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size <= 200) { // Аватарки обычно меньше 200px
        return true;
      }
    }
    
    // Проверяем паттерны URL, указывающие на аватарки
    const avatarPatterns = [
      'avatar',
      'profile',
      'user_photo',
      'chat_photo',
      'thumb',
      'thumbnail',
      'icon',
      'emoji',
      'sticker'
    ];
    
    for (const pattern of avatarPatterns) {
      if (lowerUrl.includes(pattern)) {
        return true;
      }
    }
    
    // Проверяем размеры в параметрах URL
    const dimensionMatch = url.match(/[?&](width|height)=(\d+)/);
    if (dimensionMatch) {
      const dimension = parseInt(dimensionMatch[2]);
      if (dimension <= 200) {
        return true;
      }
    }
    
    return false;
  }

  private async restartClient(): Promise<void> {
    try {
      this.restartAttempts++;
      console.log(`🔄 Попытка перезапуска WhatsApp клиента #${this.restartAttempts}`);
      
      if (this.restartAttempts > 5) {
        console.log('❌ Превышено максимальное количество попыток перезапуска');
        return;
      }
      
      // Сохраняем обработчик заявок перед уничтожением клиента
      const savedApplicationHandler = this.onNewApplication;

      // Безопасно уничтожаем клиент
      try {
        if (this.client) {
          await this.client.destroy();
        }
      } catch (error) {
        console.log('⚠️ Ошибка при уничтожении клиента (игнорируем):', error instanceof Error ? error.message : 'Неизвестная ошибка');
      }

      // Ждем больше времени для полной очистки
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Пересоздаем клиент с теми же настройками
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
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-pings',
            '--disable-logging',
            '--disable-permissions-api',
            '--disable-presentation-api',
            '--disable-print-preview',
            '--disable-speech-api',
            '--disable-file-system',
            '--disable-notifications',
            '--disable-background-networking',
            '--disable-component-extensions-with-background-pages',
            '--disable-ipc-flooding-protection',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        timeout: 60000,
        ignoreDefaultArgs: ['--disable-extensions'],
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
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

      // Переустанавливаем обработчики событий
      this.setupEventHandlers();
      
      // Восстанавливаем обработчик заявок
      if (savedApplicationHandler) {
        this.onNewApplication = savedApplicationHandler;
        console.log('✅ Обработчик заявок восстановлен после перезапуска');
      }
      
      // Инициализируем клиент
      this.client.initialize();
      console.log('✅ WhatsApp клиент перезапущен');
    } catch (error) {
      console.error('Ошибка при перезапуске WhatsApp клиента:', error);
    }
  }


  // Логирование состояния клиента
  private async logClientState(): Promise<void> {
    try {
      if (!this.client) {
        console.log('📊 Клиент не инициализирован');
        return;
      }

      // getState() возвращает Promise, поэтому нужно await
      let state = 'UNKNOWN';
      try {
        state = await this.client.getState();
      } catch (error) {
        state = 'ERROR';
        console.log('📊 Ошибка получения состояния:', error instanceof Error ? error.message : 'Неизвестная ошибка');
      }

      const info = this.client.info;
      const hasPage = this.client.pupPage && !this.client.pupPage.isClosed();
      
      console.log('📊 Состояние WhatsApp клиента:', {
        state: state,
        isReady: info ? 'Да' : 'Нет',
        hasPage: hasPage ? 'Да' : 'Нет',
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

      // Проверяем состояние клиента (getState() возвращает Promise)
      let state = 'UNKNOWN';
      try {
        state = await this.client.getState();
      } catch (error) {
        console.log('📊 Ошибка получения состояния для сохранения сессии:', error instanceof Error ? error.message : 'Неизвестная ошибка');
        return;
      }

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
            const now = Date.now();
            const tenYears = 315360000000; // 10 лет в миллисекундах
            
            window.localStorage.setItem('wwebjs_session_saved', now.toString());
            window.localStorage.setItem('wwebjs_session_duration', tenYears.toString());
            window.localStorage.setItem('wwebjs_session_configured', 'true');
            window.localStorage.setItem('wwebjs_session_keep_alive', 'true');
            window.localStorage.setItem('wwebjs_session_auto_reconnect', 'true');
            window.localStorage.setItem('wwebjs_session_expires', (now + tenYears).toString());
            window.localStorage.setItem('wwebjs_session_persistent', 'true');
            
            // Дополнительные настройки для долгосрочной сессии
            window.localStorage.setItem('wwebjs_session_never_expire', 'true');
            window.localStorage.setItem('wwebjs_session_auto_refresh', 'true');
            window.localStorage.setItem('wwebjs_session_backup_enabled', 'true');
          }
          
          // Также сохраняем в sessionStorage для дополнительной надежности
          if (window.sessionStorage) {
            window.sessionStorage.setItem('wwebjs_session_active', 'true');
            window.sessionStorage.setItem('wwebjs_session_timestamp', Date.now().toString());
          }
        } catch (e) {
          console.log('Ошибка при сохранении в localStorage:', e);
        }
      });
      
      console.log('💾 Сессия принудительно сохранена с настройками на 10 лет');
      
      // Создаем архив для переноса на VPS (только если состояние CONNECTED)
      if (state === 'CONNECTED') {
        await this.createAuthArchive();
      }
      
    } catch (error) {
      // Логируем только если это не ошибка закрытой сессии
      if (error instanceof Error && !error.message.includes('Session closed') && !error.message.includes('Target closed')) {
        console.log('⚠️ Не удалось принудительно сохранить сессию:', error.message);
      }
    }
  }

  // Создание архива авторизации для переноса на VPS
  private async createAuthArchive(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const authDir = '.wwebjs_auth';
      const archiveName = 'whatsapp_auth_latest.tar.gz'; // Фиксированное имя файла

      // Проверяем, существует ли папка авторизации
      if (!fs.existsSync(authDir)) {
        console.log('📁 Папка авторизации не найдена, пропускаем создание архива');
        return;
      }

      // Удаляем старый архив, если существует
      if (fs.existsSync(archiveName)) {
        fs.unlinkSync(archiveName);
        console.log('🗑️ Удален старый архив авторизации');
      }

      // Создаем новый архив
      console.log('📦 Обновляем архив авторизации для переноса на VPS...');
      await execAsync(`tar -czf ${archiveName} ${authDir}/`);
      
      // Проверяем размер архива
      const stats = fs.statSync(archiveName);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Архив авторизации обновлен: ${archiveName} (${sizeInMB} MB)`);
      console.log(`📋 Для переноса на VPS скопируйте файл: ${archiveName}`);
      console.log(`💡 На VPS выполните: tar -xzf ${archiveName}`);
      
    } catch (error) {
      console.log('⚠️ Не удалось создать архив авторизации:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }

  // Запуск сервиса
  start(): void {
    console.log('🚀 Инициализация WhatsApp клиента...');
    console.log('🔒 Настройка долгосрочной сессии (10 лет)...');
    
    // Проверяем существование сохраненной сессии
    this.checkExistingSession();
    
    this.client.initialize();
    console.log('✅ WhatsApp бот запущен и ожидает авторизации');
    
    // Периодически сохраняем сессию и проверяем состояние
    setInterval(async () => {
      await this.forceSaveSession();
      await this.logClientState();
      await this.monitorSessionHealth();
    }, 2 * 60 * 1000); // Каждые 2 минуты для более частого сохранения

  }

  // Проверка существующей сессии
  private async checkExistingSession(): Promise<void> {
    try {
      const fs = await import('fs');
      const authDir = '.wwebjs_auth/session-nord-laundry-whatsapp';
      
      if (fs.existsSync(authDir)) {
        console.log('✅ Найдена сохраненная сессия WhatsApp');
        
        // Проверяем возраст сессии
        const stats = fs.statSync(authDir);
        const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        console.log(`📅 Возраст сессии: ${Math.floor(ageInDays)} дней`);
        
        if (ageInDays < 365) { // Менее года
          console.log('✅ Сессия должна быть действительной, попытка автоматического входа...');
        } else {
          console.log('⚠️ Сессия старая, может потребоваться повторная авторизация');
        }
      } else {
        console.log('⚠️ Сохраненная сессия не найдена, потребуется QR авторизация');
      }
    } catch (error) {
      console.log('⚠️ Ошибка проверки сессии:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }


  // Мониторинг здоровья сессии
  private async monitorSessionHealth(): Promise<void> {
    try {
      if (!this.client) {
        console.log('📊 Клиент не инициализирован для мониторинга');
        return;
      }

      let state = 'UNKNOWN';
      try {
        state = await this.client.getState();
      } catch (error) {
        console.log('⚠️ Ошибка получения состояния для мониторинга:', error instanceof Error ? error.message : 'Неизвестная ошибка');
        // Если не можем получить состояние, пытаемся перезапустить
        setTimeout(() => {
          this.restartClient();
        }, 5000);
        return;
      }

      // Проверяем различные состояния
      if (state === 'CONNECTED') {
        // Сессия в порядке, сбрасываем счетчик попыток
        this.restartAttempts = 0;
        
        // Дополнительно проверяем, что сессия действительно активна
        try {
          if (this.client.pupPage && !this.client.pupPage.isClosed()) {
            const sessionActive = await this.client.pupPage.evaluate(() => {
              return window.localStorage.getItem('wwebjs_session_active') === 'true';
            });
            
            if (!sessionActive) {
              console.log('⚠️ Сессия не активна в localStorage, принудительно сохраняем...');
              await this.forceSaveSession();
            }
          }
        } catch (error) {
          console.log('⚠️ Ошибка проверки активности сессии:', error instanceof Error ? error.message : 'Неизвестная ошибка');
        }
      } else if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.log('⚠️ Обнаружено разлогинивание в мониторинге, перезапускаем...');
        setTimeout(() => {
          this.restartClient();
        }, 3000);
      } else if (state === 'TIMEOUT' || state === 'CONFLICT') {
        console.log('⚠️ Обнаружена проблема с сессией в мониторинге, перезапускаем...');
        setTimeout(() => {
          this.restartClient();
        }, 5000);
      } else if (state === 'OPENING') {
        console.log('📱 Сессия открывается, ожидаем...');
      } else {
        console.log(`📊 Неизвестное состояние сессии: ${state}`);
      }
    } catch (error) {
      console.log('⚠️ Ошибка в мониторинге сессии:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
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