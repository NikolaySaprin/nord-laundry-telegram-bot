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
    // КРИТИЧНО: Проверяем флаг принудительного сброса ДО создания клиента
    const forceReset = process.env.WHATSAPP_FORCE_RESET === 'true';
    if (forceReset) {
      console.log('🚨 РЕЖИМ ПРИНУДИТЕЛЬНОГО СБРОСА: WHATSAPP_FORCE_RESET=true');
      console.log('🗑️  .wwebjs_auth будет удалена при первом запуске');
    }
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "nord-laundry-whatsapp",
        dataPath: "./.wwebjs_auth"
      }),
      puppeteer: {
        headless: true,

        executablePath: process.env.NODE_ENV === 'production' ? '/usr/bin/chromium-browser' : undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer',
          // ИСПРАВЛЕНО: используем ./tmp вместо /tmp
          '--user-data-dir=./tmp/chromium-user-data',
          '--data-path=./tmp/chromium-data',
          '--disk-cache-dir=./tmp/chromium-cache',
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
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--disable-default-apps',
          '--disable-extensions-file-access-check',
          '--disable-component-extensions-with-background-pages',
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

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    console.log('🔧 Настраиваем обработчики событий WhatsApp...');

    this.client.on('loading_screen', (percent: number, message: string) => {
      console.log(`📱 Загрузка WhatsApp сессии: ${percent}% - ${message}`);
    });


    this.client.on('qr', (qr: string) => {
      console.log('🔐 QR код для авторизации WhatsApp:');
      console.log('⚠️  ВНИМАНИЕ: Это означает, что сохраненная сессия недействительна');
      console.log('📱 Отсканируйте этот QR код с помощью WhatsApp на телефоне:');
      console.log('   1. Откройте WhatsApp на телефоне');
      console.log('   2. Перейдите в Настройки > Связанные устройства');
      console.log('   3. Нажмите "Связать устройство"');
      console.log('   4. Отсканируйте QR код ниже:');
      console.log('');
      

      try {
        qrcode.generate(qr, { small: true });
      } catch (error) {
        console.log('⚠️ Не удалось отобразить QR код в терминале');
      }
      

      console.log('');
      console.log('📋 Откройте эту ссылку в браузере для получения QR кода:');
      console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
      console.log('');
      console.log('⏳ Ожидание авторизации...');
    });


    this.client.on('message', async (message: Message) => {
      console.log('🔔 ==========================================');
      console.log('🔔 ПОЛУЧЕНО СОБЫТИЕ MESSAGE ОТ WHATSAPP');
      console.log('🔔 ==========================================');
      console.log('📝 Детали сообщения:', {
        from: message.from,
        body: message.body?.substring(0, 100),
        type: message.type,
        hasMedia: message.hasMedia,
        timestamp: new Date().toISOString(),
        isGroup: message.from.includes('@g.us'),
        isStatus: message.isStatus
      });
      console.log('🔍 Проверка обработчика заявок:', !!this.onNewApplication);
      
      await this.handleIncomingMessage(message);
      
      console.log('✅ Обработка сообщения завершена');
      console.log('🔔 ==========================================');
    });


    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ Ошибка авторизации WhatsApp:', msg);
      console.log('💡 Возможно, нужно отсканировать QR код заново');
    });


    this.client.on('disconnected', (reason: string) => {
      console.log('📱 WhatsApp клиент отключен:', reason);
      

      if (reason !== 'LOGOUT') {
        console.log('🔄 Перезапускаем WhatsApp клиент через 3 секунды...');
        setTimeout(() => {
          this.restartClient();
        }, 3000);
      } else {
        console.log('⚠️ Произошел выход из аккаунта, требуется повторная авторизация');
      }
    });


    this.client.on('change_state', (state: string) => {
      console.log('📱 WhatsApp состояние изменилось:', state);
      this.logClientState();
      

      if (state === 'CONNECTED') {
        setTimeout(() => {
          this.forceSaveSession();
        }, 1000);
      }
      

      if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.log('⚠️ Обнаружено разлогинивание, пытаемся восстановить сессию...');
        setTimeout(() => {
          this.restartClient();
        }, 5000);
      }
    });


    this.client.on('remote_session_saved', () => {
      console.log('💾 Сессия WhatsApp сохранена');
    });


    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp клиент авторизован');
      console.log('🔒 Сессия настроена на 10 лет без перелогина');
      this.logClientState();
      

      setTimeout(() => {
        this.forceSaveSession();
      }, 1000);
      

      setTimeout(() => {
        this.createAuthArchive();
      }, 3000);
    });


    this.client.on('auth_failure', (msg: string) => {
      console.error('❌ Ошибка авторизации WhatsApp:', msg);
      console.log('💡 Возможно, нужно отсканировать QR код заново');
    });


    this.client.on('change_state', (state: string) => {
      console.log('📱 WhatsApp состояние:', state);
      if (state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.log('⚠️ Обнаружено разлогинивание, пытаемся восстановить сессию...');

      }
    });


    this.client.on('remote_session_saved', () => {
      console.log('💾 Сессия WhatsApp сохранена на диск');
      console.log('🔒 Сессия будет сохранена на 10 лет');
    });


    this.client.on('qr', (qr: string) => {
      console.log('🔐 QR код обновлен');
    });



    this.client.on('ready', async () => {
      console.log('✅ WhatsApp бот готов к работе!');
      this.logClientState();
      this.restartAttempts = 0;
      
      // КРИТИЧЕСКАЯ ПРОВЕРКА
      if (!this.onNewApplication) {
        console.log('❌❌❌ КРИТИЧЕСКАЯ ОШИБКА: Обработчик заявок не установлен!');
        console.log('⚠️  СООБЩЕНИЯ ИЗ WHATSAPP НЕ БУДУТ ПЕРЕСЫЛАТЬСЯ В TELEGRAM!');
      } else {
        console.log('✅✅✅ Обработчик заявок активен и готов к работе');
        console.log('🚀 WhatsApp будет пересылать сообщения в Telegram');
      }
      
      // ВАЖНО: Получаем информацию о подключенном аккаунте
      try {
        const info = this.client.info;
        if (info) {
          console.log('📱 ==========================================');
          console.log('📱 ИНФОРМАЦИЯ О WHATSAPP АККАУНТЕ:');
          console.log('📱 Номер телефона:', info.wid?.user || 'Неизвестно');
          console.log('📱 Полный WID:', info.wid?._serialized || 'Неизвестно');
          console.log('📱 Имя аккаунта:', info.pushname || 'Не указано');
          console.log('📱 Платформа:', info.platform || 'Неизвестно');
          console.log('📱 ==========================================');
        } else {
          console.log('⚠️ Информация о WhatsApp аккаунте пока недоступна');
        }
      } catch (error) {
        console.log('⚠️ Ошибка получения информации об аккаунте:', error);
      }

      setTimeout(() => {
        this.forceSaveSession();
      }, 2000);
      

      setTimeout(() => {
        this.createAuthArchive();
      }, 5000);


      try {
        const chats = await this.client.getChats();
        console.log(`📊 Найдено ${chats.length} чатов`);
        console.log('💡 Приветственные сообщения будут отправлены только при первом сообщении от пользователя');
      } catch (error) {
        console.log('⚠️ Не удалось получить список чатов:', error);
      }
    });


    process.on('uncaughtException', (error) => {
      if (error.message.includes('Protocol error') || error.message.includes('Execution context was destroyed') || error.message.includes('Session closed')) {
        console.log('⚠️ Обнаружена критическая ошибка Puppeteer, пытаемся восстановить сессию...');
        console.log('💡 Ошибка:', error.message);
        

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
          

          setTimeout(() => {
            this.restartClient();
          }, 10000);
        }
      }
    });
  }


  setApplicationHandler(handler: (application: Application) => Promise<void>): void {
    console.log('🔧 ==========================================');
    console.log('🔧 УСТАНОВКА ОБРАБОТЧИКА ЗАЯВОК');
    console.log('🔧 ==========================================');
    console.log('🔧 Полученный обработчик:', typeof handler);
    console.log('🔧 Обработчик является функцией:', typeof handler === 'function');
    
    this.onNewApplication = handler;
    
    console.log('✅ Обработчик заявок установлен:', !!this.onNewApplication);
    console.log('👁️  Теперь WhatsApp будет пересылать сообщения в Telegram');
    console.log('🔧 ==========================================');
  }


  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      console.log('📨 ==========================================');
      console.log('📨 НАЧАЛО ОБРАБОТКИ ВХОДЯЩЕГО СООБЩЕНИЯ');
      console.log('📨 ==========================================');
      console.log('📨 Детали сообщения:', {
        from: message.from,
        body: message.body,
        type: message.type,
        isStatus: message.isStatus,
        hasMedia: message.hasMedia
      });


      if (!this.client) {
        console.log('❌ WhatsApp клиент не инициализирован');
        return;
      }


      if (message.from.includes('@g.us')) {
        console.log('⏭️ Пропускаем сообщение из группы');
        return;
      }
      
      if (message.isStatus) {
        console.log('⏭️ Пропускаем статус');
        return;
      }


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


      if (!message.body && !message.hasMedia) {
        console.log('⏭️ Пропускаем пустое сообщение');
        return;
      }


      const contact = await message.getContact();
      const userPhone = contact.number;
      const userName = contact.name || contact.pushname || 'Пользователь';
      const userMessage = message.body;

      console.log('👤 ==========================================');
      console.log('👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:');
      console.log('👤 Телефон:', userPhone);
      console.log('👤 Имя:', userName);
      console.log('👤 Сообщение:', userMessage?.substring(0, 100));
      console.log('👤 ==========================================');




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

      console.log('📦 ==========================================');
      console.log('📦 СОЗДАНА ЗАЯВКА ДЛЯ ОТПРАВКИ:');
      console.log('📦 Source:', application.source);
      console.log('📦 Phone:', application.whatsappUserPhone);
      console.log('📦 Name:', application.whatsappUserName);
      console.log('📦 Message:', application.userMessage?.substring(0, 100));
      console.log('📦 MessageType:', application.messageType);
      console.log('📦 ==========================================');


      if (this.onNewApplication) {
        console.log('🚀 ==========================================');
        console.log('🚀 ПЕРЕСЫЛАЕМ ЗАЯВКУ В TELEGRAM');
        console.log('🚀 ==========================================');
        console.log('✅ Обработчик заявок найден');
        console.log('📤 Отправляем заявку...');
        
        try {
          await this.onNewApplication(application);
          console.log('✅✅✅ ЗАЯВКА УСПЕШНО ОТПРАВЛЕНА В TELEGRAM');
        } catch (error) {
          console.error('❌❌❌ ОШИБКА ПРИ ОТПРАВКЕ ЗАЯВКИ В TELEGRAM:', error);
          console.error('❌ Детали ошибки:', error instanceof Error ? error.message : error);
          console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
        }
      } else {
        console.log('❌❌❌ ==========================================');
        console.log('❌❌❌ КРИТИЧЕСКАЯ ОШИБКА!');
        console.log('❌❌❌ ОБРАБОТЧИК ЗАЯВОК НЕ НАЙДЕН!');
        console.log('❌❌❌ ==========================================');
        console.log('🔍 Состояние onNewApplication:', this.onNewApplication);
        console.log('⚠️  СООБЩЕНИЕ НЕ БУДЕТ ОТПРАВЛЕНО В TELEGRAM!');
        console.log('🔧 Необходимо вызвать setApplicationHandler() для установки обработчика');
      }


      if (!this.thanksMessageSent.has(userPhone)) {
        const thanksText = `Спасибо за заявку!\nМы свяжемся с Вами в ближайшее время`;
        console.log('💬 ==========================================');
        console.log('💬 ОТПРАВЛЯЕМ БЛАГОДАРНОСТЬ КЛИЕНТУ');
        console.log('💬 Клиент:', userPhone);
        console.log('💬 Сообщение:', thanksText);
        console.log('💬 ==========================================');
        
        await message.reply(thanksText);
        this.thanksMessageSent.add(userPhone);
        
        console.log('✅ Благодарность отправлена клиенту');
      } else {
        console.log('⏭️ Благодарность уже отправлена этому клиенту ранее');
      }

      console.log('🏁 ==========================================');
      console.log('🏁 ОБРАБОТКА СООБЩЕНИЯ ЗАВЕРШЕНА УСПЕШНО');
      console.log('🏁 ==========================================');

    } catch (error) {
      console.error('❌❌❌ ==========================================');
      console.error('❌❌❌ ОШИБКА ОБРАБОТКИ СООБЩЕНИЯ!');
      console.error('❌❌❌ ==========================================');
      console.error('❌ Детали ошибки:', error);
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
      

      if (error instanceof Error && 
          (error.message.includes('Protocol error') || 
           error.message.includes('Execution context was destroyed') ||
           error.message.includes('Target closed'))) {
        console.log('⚠️ Обнаружена ошибка Puppeteer при обработке сообщения');
        console.log('💡 Сообщение не обработано, но сессия сохранена');
      }
    }
  }


  private async saveMediaFile(media: any, userPhone: string): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const extension = media.mimetype.split('/')[1] || 'bin';
      const filename = `whatsapp_${userPhone}_${timestamp}.${extension}`;
      

      console.log(`Медиа файл сохранен: ${filename}`);
      

      return `https://your-server.com/media/${filename}`;
    } catch (error) {
      console.error('Ошибка сохранения медиа файла:', error);
      return null;
    }
  }


  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      const chatId = `${to}@c.us`;
      await this.client.sendMessage(chatId, message);
      return true;
    } catch (error) {
      console.error('Ошибка отправки сообщения пользователю WhatsApp:', error);
      

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


  async sendManagerReply(reply: ManagerReply): Promise<boolean> {
    if (reply.targetPlatform !== 'whatsapp') {
      return false;
    }

    try {

      if (reply.message) {

        let cleanMessage = reply.message;
        

        cleanMessage = cleanMessage.replace(/https:\/\/t\.me\/[^\s\n]+/g, '');
        

        cleanMessage = cleanMessage.replace(/@[a-zA-Z0-9_]+/g, '');
        

        cleanMessage = cleanMessage.replace(/\[[^\]]+\]/g, '');
        cleanMessage = cleanMessage.replace(/\([^)]*message[^)]*\)/gi, '');
        cleanMessage = cleanMessage.replace(/\([^)]*thread[^)]*\)/gi, '');
        

        cleanMessage = cleanMessage.replace(/\n\s*\n/g, '\n').trim();
        cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();
        

        cleanMessage = cleanMessage.replace(/^\s*\n+|\n+\s*$/g, '');
        

        if (!cleanMessage || cleanMessage.length < 2) {
          cleanMessage = 'Ответ от менеджера';
        }
        

        const telegramLink = `https://t.me/${reply.managerUsername.replace('@', '')}`;
        const managerMessage = `${cleanMessage}\n\n📱 Связаться с менеджером в Telegram: ${telegramLink}`;
        await this.sendTextMessage(reply.targetUserId, managerMessage);
      }


      if (reply.mediaUrls && reply.mediaUrls.length > 0) {
        for (const mediaUrl of reply.mediaUrls) {

          if (this.isServiceImage(mediaUrl)) {
            console.log('⏭️ Пропускаем служебное изображение:', mediaUrl);
            continue;
          }
          

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


  private isServiceImage(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    

    const sizeMatch = url.match(/[?&]size=(\d+)/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size <= 200) {
        return true;
      }
    }
    

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
      

      const savedApplicationHandler = this.onNewApplication;
      console.log('💾 Сохраняем обработчик заявок перед перезапуском:', !!savedApplicationHandler);


      try {
        if (this.client) {
          await this.client.destroy();
        }
      } catch (error) {
        console.log('⚠️ Ошибка при уничтожении клиента (игнорируем):', error instanceof Error ? error.message : 'Неизвестная ошибка');
      }


      await new Promise(resolve => setTimeout(resolve, 5000));
      

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


      this.setupEventHandlers();
      

      if (savedApplicationHandler) {
        this.onNewApplication = savedApplicationHandler;
        console.log('✅ Обработчик заявок восстановлен после перезапуска:', !!this.onNewApplication);
        console.log('🔄 Повторная регистрация обработчика message...');
      } else {
        console.log('❌ КРИТИЧНО: Обработчик заявок НЕ БЫЛ СОХРАНЕН!');
      }
      

      this.client.initialize();
      console.log('✅ WhatsApp клиент перезапущен с восстановленным обработчиком');
    } catch (error) {
      console.error('Ошибка при перезапуске WhatsApp клиента:', error);
    }
  }



  private async logClientState(): Promise<void> {
    try {
      if (!this.client) {
        console.log('📊 Клиент не инициализирован');
        return;
      }


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


  private async forceSaveSession(): Promise<void> {
    try {

      if (!this.client) {
        console.log('📊 Клиент не инициализирован, пропускаем сохранение сессии');
        return;
      }


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


      if (!this.client.pupPage || this.client.pupPage.isClosed()) {
        console.log('📊 Страница недоступна, пропускаем сохранение сессии');
        return;
      }


      await this.client.pupPage.evaluate(() => {
        try {

          if (window.localStorage) {
            const now = Date.now();
            const tenYears = 315360000000;
            
            window.localStorage.setItem('wwebjs_session_saved', now.toString());
            window.localStorage.setItem('wwebjs_session_duration', tenYears.toString());
            window.localStorage.setItem('wwebjs_session_configured', 'true');
            window.localStorage.setItem('wwebjs_session_keep_alive', 'true');
            window.localStorage.setItem('wwebjs_session_auto_reconnect', 'true');
            window.localStorage.setItem('wwebjs_session_expires', (now + tenYears).toString());
            window.localStorage.setItem('wwebjs_session_persistent', 'true');
            

            window.localStorage.setItem('wwebjs_session_never_expire', 'true');
            window.localStorage.setItem('wwebjs_session_auto_refresh', 'true');
            window.localStorage.setItem('wwebjs_session_backup_enabled', 'true');
          }
          

          if (window.sessionStorage) {
            window.sessionStorage.setItem('wwebjs_session_active', 'true');
            window.sessionStorage.setItem('wwebjs_session_timestamp', Date.now().toString());
          }
        } catch (e) {
          console.log('Ошибка при сохранении в localStorage:', e);
        }
      });
      
      console.log('💾 Сессия принудительно сохранена с настройками на 10 лет');
      

      if (state === 'CONNECTED') {
        await this.createAuthArchive();
      }
      
    } catch (error) {

      if (error instanceof Error && !error.message.includes('Session closed') && !error.message.includes('Target closed')) {
        console.log('⚠️ Не удалось принудительно сохранить сессию:', error.message);
      }
    }
  }


  private async createAuthArchive(): Promise<void> {
    // Проверяем нужно ли создавать архив (по умолчанию - нет, только если явно включено)
    const shouldCreateArchive = process.env.CREATE_AUTH_ARCHIVE === 'true';
    
    if (!shouldCreateArchive) {
      console.log('📦 Создание архива отключено (CREATE_AUTH_ARCHIVE != true)');
      return;
    }
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const authDir = '.wwebjs_auth';
      const archiveName = 'whatsapp_auth_latest.tar.gz';


      if (!fs.existsSync(authDir)) {
        console.log('📁 Папка авторизации не найдена, пропускаем создание архива');
        return;
      }


      if (fs.existsSync(archiveName)) {
        fs.unlinkSync(archiveName);
        console.log('🗑️ Удален старый архив авторизации');
      }


      console.log('📦 Обновляем архив авторизации для переноса на VPS...');
      await execAsync(`tar -czf ${archiveName} ${authDir}/`);
      

      const stats = fs.statSync(archiveName);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Архив авторизации обновлен: ${archiveName} (${sizeInMB} MB)`);
      console.log(`📋 Для переноса на VPS скопируйте файл: ${archiveName}`);
      console.log(`💡 На VPS выполните: tar -xzf ${archiveName}`);
      
    } catch (error) {
      console.log('⚠️ Не удалось создать архив авторизации:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }


  start(): void {
    console.log('🚀 Инициализация WhatsApp клиента...');
    console.log('🔒 Настройка долгосрочной сессии (10 лет)...');
    
    // КРИТИЧНО: Создаем ./tmp директорию если не существует
    this.ensureTmpDirectory();
    
    // Проверяем сессию
    this.checkExistingSession();
    
    this.client.initialize();
    console.log('✅ WhatsApp бот запущен и ожидает авторизации');
    


    setInterval(async () => {
      await this.forceSaveSession();
      await this.logClientState();
      await this.monitorSessionHealth();
    }, 5 * 60 * 1000);

  }

  private ensureTmpDirectory(): void {
    try {
      const fs = require('fs');
      const tmpDir = './tmp';
      
      if (!fs.existsSync(tmpDir)) {
        console.log('📁 Создаем ./tmp директорию...');
        fs.mkdirSync(tmpDir, { recursive: true });
        console.log('✅ ./tmp директория создана');
      }
      
      // Также создаем подпапки
      const subdirs = ['chromium-user-data', 'chromium-data', 'chromium-cache'];
      subdirs.forEach(dir => {
        const fullPath = `${tmpDir}/${dir}`;
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });
      
      console.log('✅ Все временные директории готовы');
    } catch (error) {
      console.error('⚠️ Ошибка создания ./tmp директории:', error);
    }
  }


  stop(): void {
    console.log('🛑 Остановка WhatsApp клиента...');
    try {
      if (this.client) {
        this.client.destroy();
        console.log('✅ WhatsApp клиент остановлен');
      }
    } catch (error) {
      console.error('⚠️ Ошибка при остановке WhatsApp клиента:', error);
    }
  }


  private async checkExistingSession(): Promise<void> {
    try {
      const fs = await import('fs');
      const authDir = '.wwebjs_auth/session-nord-laundry-whatsapp';
      
      // Проверяем режим принудительного сброса сессии
      const forceReset = process.env.WHATSAPP_FORCE_RESET === 'true';
      
      if (forceReset && fs.existsSync(authDir)) {
        console.log('🚨 РЕЖИМ ПРИНУДИТЕЛЬНОГО СБРОСА WHATSAPP_FORCE_RESET=true');
        console.log('🗑️  Удаляем существующую сессию...');
        
        try {
          // Удаляем всю папку .wwebjs_auth
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          
          await execAsync('rm -rf .wwebjs_auth/');
          console.log('✅ Сессия удалена успешно');
          console.log('🔐 Будет запрошен QR код для новой авторизации');
          console.log('⚠️  После авторизации удалите WHATSAPP_FORCE_RESET из .env и перезапустите бота');
        } catch (error) {
          console.error('❌ Ошибка удаления сессии:', error);
        }
        return;
      }
      
      // КРИТИЧНО: Проверяем откуда берется сессия
      if (fs.existsSync('.wwebjs_auth')) {
        console.log('⚠️  ОБНАРУЖЕНА ПАПКА .wwebjs_auth');
        console.log('📂 Содержимое:');
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        try {
          const { stdout } = await execAsync('ls -lah .wwebjs_auth/');
          console.log(stdout);
        } catch (e) {
          console.log('Не удалось прочитать содержимое');
        }
      }
      
      if (fs.existsSync(authDir)) {
        console.log('✅ Найдена сохраненная сессия WhatsApp');
        

        const stats = fs.statSync(authDir);
        const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        console.log(`📅 Возраст сессии: ${Math.floor(ageInDays)} дней`);
        
        if (ageInDays < 365) {
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


        console.log('💡 Ожидаем инициализации клиента, не перезапускаем...');
        return;
      }

      console.log(`📊 Текущее состояние WhatsApp: ${state}`);


      if (state === 'CONNECTED') {

        this.restartAttempts = 0;
        console.log('✅ WhatsApp подключен и работает нормально');
        

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
        console.log('⚠️ Обнаружено разлогинивание в мониторинге');
        console.log('💡 Требуется повторная авторизация через QR код');

      } else if (state === 'TIMEOUT' || state === 'CONFLICT') {
        console.log('⚠️ Обнаружена проблема с сессией:', state);
        console.log('💡 Проверьте, не открыт ли WhatsApp Web в браузере');

      } else if (state === 'OPENING') {
        console.log('📱 Сессия открывается, ожидаем завершения инициализации...');

      } else {
        console.log(`📊 Состояние сессии: ${state} - ожидаем готовности клиента...`);

      }
    } catch (error) {
      console.log('⚠️ Ошибка в мониторинге сессии:', error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }


  clearThanksHistory(): void {
    this.thanksMessageSent.clear();
    console.log('🧹 История отправленных благодарственных сообщений очищена');
  }
}