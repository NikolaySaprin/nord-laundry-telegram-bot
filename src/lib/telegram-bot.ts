import { Bot, Context } from 'grammy';
import { Application, ManagerReply } from '../types/application-types.js';
import { WhatsAppService } from './whatsapp-service.js';

export class ApplicationBot {
  private bot: Bot;
  private groupChatId: string;
  private activeThreads: Map<string, number> = new Map(); // Хранит thread_id по идентификатору пользователя
  private threadToUser: Map<number, { userId?: string; platform: 'telegram' | 'whatsapp'; userIdentifier: string }> = new Map(); // Хранит данные пользователя по thread_id
  private thanksMessageSent: Set<string> = new Set(); // Отслеживаем отправленные благодарственные сообщения
  private whatsappService?: WhatsAppService;

  constructor(token: string, groupChatId: string, enableWhatsApp: boolean = false) {
    if (!token) {
      throw new Error('Telegram bot token is required');
    }
    if (!groupChatId) {
      throw new Error('Group chat ID is required');
    }
    this.groupChatId = groupChatId;
    this.bot = new Bot(token);
    
    // Инициализируем WhatsApp сервис, если включен
    if (enableWhatsApp) {
      console.log('🔧 Инициализируем WhatsApp сервис...');
      this.whatsappService = new WhatsAppService();
      // Устанавливаем обработчик для новых заявок из WhatsApp
      this.whatsappService.setApplicationHandler((application: Application) => this.handleNewApplication(application));
      console.log('✅ WhatsApp сервис инициализирован и обработчик установлен');
    } else {
      console.log('⚠️ WhatsApp сервис отключен');
    }
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // Обработчик команды /start для личных сообщений
    this.bot.command('start', async (ctx: Context) => {
      await ctx.reply(`Добро пожаловать! Опишите ваш вопрос, и наши специалисты свяжутся с вами в ближайшее время.`);
    });

    // Обрабатываем все текстовые сообщения в личных чатах
    this.bot.on('message', async (ctx: Context) => {
      if (ctx.chat?.type === 'private') {
        // Обработка личных сообщений от клиентов
        const user = ctx.from;
        const messageText = ctx.message?.text;
        
        if (!user || !messageText) return;

        // Создаем заявку из сообщения в Telegram
        const application: Application = {
          source: 'telegram_direct',
          userIdentifierTelegram: `tg_${user.username || user.id}`,
          userNameTelegram: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь',
          userUsernameTelegram: user.username || undefined,
          userMessage: messageText,
          telegramUserId: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь', // Имя для общего поля
          phone: 'Не указан', // В Telegram телефон не доступен по умолчанию
          messageType: 'text'
        };

        await this.handleNewApplication(application);
        
        // Отправляем благодарственное сообщение только при первом сообщении
        const userIdentifier = `tg_${user.id}`;
        if (!this.thanksMessageSent.has(userIdentifier)) {
          await ctx.reply("Спасибо за заявку!\nМы свяжемся с Вами в ближайшее время");
          this.thanksMessageSent.add(userIdentifier);
        }
      } else if (ctx.chat?.id.toString() === this.groupChatId.toString()) {
        if (ctx.message?.message_thread_id) {
          // Обработка сообщений в темах форума (ответы менеджеров)
          await this.handleManagerReply(ctx);
        } else {
          // Сообщения в общем чате группы без thread_id игнорируются
          console.log('Игнорируется сообщение в общем чате группы (без thread_id):', {
            chatId: ctx.chat?.id,
            fromUserId: ctx.from?.id,
            messageText: ctx.message?.text || ctx.message?.caption
          });
        }
      }
    });
  }

  async handleNewApplication(application: Application): Promise<void> {
    try {
      console.log('📋 Обрабатываем новую заявку:', {
        source: application.source,
        userMessage: application.userMessage,
        userName: application.name
      });

      // Создаем уникальный идентификатор для каждой заявки
      let userIdentifier: string;
      let platform: 'whatsapp' | 'telegram';
      let shouldCreateNewThread: boolean;
      
      if (application.source === 'whatsapp') {
        // WhatsApp - используем номер телефона как идентификатор
        userIdentifier = application.whatsappUserId!;
        platform = 'whatsapp';
        // Для WhatsApp создаем тему только если её нет
        shouldCreateNewThread = !this.activeThreads.has(userIdentifier);
      } else if (application.source === 'telegram_direct') {
        // Telegram - используем telegram ID как идентификатор
        userIdentifier = application.userIdentifierTelegram!;
        platform = 'telegram';
        // Для Telegram создаем тему только если её нет
        shouldCreateNewThread = !this.activeThreads.has(userIdentifier);
      } else {
        // Заявки с сайта (website_form, contact_form, bottom_form, services_form, modal_form)
        // ВСЕГДА создаем новую тему для каждой заявки с сайта
        const timestamp = Date.now();
        userIdentifier = `website_${application.source}_${application.phone}_${timestamp}`;
        platform = 'telegram';
        shouldCreateNewThread = true; // Всегда создаем новую тему для заявок с сайта
      }
      
      let threadId = this.activeThreads.get(userIdentifier);

      console.log('🔍 Анализ заявки:', {
        source: application.source,
        userIdentifier,
        platform,
        existingThreadId: threadId,
        shouldCreateNewThread,
        isWebsiteForm: !['whatsapp', 'telegram_direct'].includes(application.source)
      });
      
      if (shouldCreateNewThread) {
        // Создаем новую тему форума
        const topicName = this.generateTopicName(application);
        console.log('🆕 Создаем новую тему форума:', topicName);
        
        const topic = await this.bot.api.createForumTopic(
          this.groupChatId, 
          topicName
        );
        
        threadId = topic.message_thread_id;
        this.activeThreads.set(userIdentifier, threadId);
        this.threadToUser.set(threadId, {
          userId: application.whatsappUserId || application.telegramUserId?.toString(),
          platform,
          userIdentifier
        });
        
        console.log('✅ Новая тема создана с ID:', threadId);
        
        // Отправляем первоначальное сообщение о заявке
        const message = this.formatApplicationMessage(application);
        console.log('📤 Отправляем сообщение о заявке в тему:', threadId);
        await this.bot.api.sendMessage(
          this.groupChatId, 
          message,
          { message_thread_id: threadId }
        );
        console.log('✅ Сообщение о заявке отправлено');
      } else {
        // Добавляем в существующую тему
        console.log('📝 Добавляем сообщение в существующую тему:', threadId);
        const message = this.formatNewMessage(application);
        await this.bot.api.sendMessage(
          this.groupChatId,
          message,
          { message_thread_id: threadId }
        );
        console.log('✅ Сообщение добавлено в существующую тему');
      }
    } catch (error) {
      console.error('Ошибка обработки заявки:', error);
    }
  }

  private generateTopicName(application: Application): string {
    const sourceLabels: Record<Application['source'], string> = {
      'website_form': 'Сайт',
      'contact_form': 'Форма контакта',
      'bottom_form': 'Нижняя форма',
      'services_form': 'Услуги',
      'modal_form': 'Модальное окно',
      'whatsapp': 'WhatsApp',
      'telegram_direct': 'Telegram'
    };
    
    const sourceLabel = sourceLabels[application.source] || 'Сайт';
    
    switch (application.source) {
      case 'telegram_direct':
        return `${sourceLabel}: @${application.userUsernameTelegram || application.telegramUserId}`;
      case 'whatsapp':
        return `${sourceLabel}: ${application.whatsappUserName} (${application.whatsappUserPhone})`;
      default:
        return `${sourceLabel}: ${application.name} (${application.phone})`;
    }
  }

  private formatApplicationMessage(application: Application): string {
    const sourceLabels: Record<Application['source'], string> = {
      'website_form': 'с сайта',
      'contact_form': 'из формы контакта',
      'bottom_form': 'из нижней формы',
      'services_form': 'из раздела услуг',
      'modal_form': 'из модального окна',
      'whatsapp': 'из WhatsApp',
      'telegram_direct': 'из Telegram'
    };
    
    const sourceLabel = sourceLabels[application.source] || 'с сайта';
    
    // Форматируем время в московском часовом поясе (+3 UTC)
    const moscowTime = new Date().toLocaleString('ru-RU', { 
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    let message: string;
    
    if (application.source === 'telegram_direct') {
      message = `💬 Новая заявка ${sourceLabel}:\n\n👤 Пользователь: ${application.userNameTelegram}${application.userUsernameTelegram ? ` (@${application.userUsernameTelegram})` : ''}\n📝 Вопрос: ${application.userMessage}`;
    } else if (application.source === 'whatsapp') {
      message = `💬 Новая заявка ${sourceLabel}:

👤 Пользователь: ${application.whatsappUserName}
📞 Телефон: ${application.whatsappUserPhone}
📝 Вопрос: ${application.userMessage}`;
    } else {
      message = `📋 Новая заявка ${sourceLabel}:\n\n👤 Имя: ${application.name}\n📞 Телефон: ${application.phone}`;
    }
    
    // Добавляем сферу деятельности, если есть
    if (application.sphere) {
      message += `\n🏢 Сфера: ${application.sphere}`;
    }
    
    // Добавляем информацию о медиа, если есть
    if (application.mediaUrls && application.mediaUrls.length > 0) {
      const mediaTypeLabels: Record<Application['messageType'], string> = {
        'text': '📝',
        'image': '🖼️',
        'video': '🎥',
        'document': '📄',
        'audio': '🎵'
      };
      const mediaLabel = mediaTypeLabels[application.messageType] || '📎';
      message += `\n${mediaLabel} Медиа: ${application.mediaUrls.length} файл(ов)`;
    }
    
    message += `\n⏰ Время: ${moscowTime} (МСК)\n\nСтатус: ⏳ Ожидает обработки`;
    
    return message;
  }

  private formatNewMessage(application: Application): string {
    // Форматируем время в московском часовом поясе (+3 UTC)
    const moscowTime = new Date().toLocaleString('ru-RU', { 
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    return `📝 Новое сообщение в заявке:\n\n${application.userMessage || 'Без текста'}\n⏰ Время: ${moscowTime} (МСК)`;
  }

  // Обработка ответов менеджеров в группе
  private async handleManagerReply(ctx: Context): Promise<void> {
    try {
      const message = ctx.message;
      const from = ctx.from;
      
      console.log('Получено сообщение в теме форума:', {
        chatId: ctx.chat?.id,
        threadId: message?.message_thread_id,
        fromUserId: from?.id,
        messageText: message?.text || message?.caption
      });
      
      if (!message || !from || !message.message_thread_id) {
        console.log('Пропуск сообщения: отсутствуют необходимые данные');
        return;
      }
      
      // Получаем текст сообщения
      const messageText = message.text || message.caption || '';
      if (!messageText.trim()) {
        console.log('Пропуск сообщения: пустой текст');
        return;
      }
      
      // Находим данные клиента по thread_id
      const userData = this.threadToUser.get(message.message_thread_id);
      if (!userData) {
        console.log('Не найден клиент для thread_id:', message.message_thread_id);
        console.log('Доступные thread_id:', Array.from(this.threadToUser.keys()));
        return;
      }
      
      // Формируем подпись менеджера
      const managerName = this.formatManagerSignature(from);
      const managerUsername = from.username ? `@${from.username}` : 'Менеджер';
      
      // Собираем медиа файлы, если есть (исключаем фото/аватары для WhatsApp)
      const mediaUrls: string[] = [];
      // Исключаем фото для WhatsApp, чтобы не загружать аватары
      // if (message.photo) {
      //   const photo = message.photo[message.photo.length - 1]; // Берем самое большое фото
      //   const file = await this.bot.api.getFile(photo.file_id);
      //   mediaUrls.push(`https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`);
      // }
      if (message.video) {
        const file = await this.bot.api.getFile(message.video.file_id);
        mediaUrls.push(`https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`);
      }
      if (message.document) {
        const file = await this.bot.api.getFile(message.document.file_id);
        mediaUrls.push(`https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`);
      }
      if (message.audio) {
        const file = await this.bot.api.getFile(message.audio.file_id);
        mediaUrls.push(`https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`);
      }
      
      const managerReply: ManagerReply = {
        threadId: message.message_thread_id,
        targetUserId: userData.userId!,
        targetPlatform: userData.platform,
        managerName,
        managerUsername,
        message: messageText,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
      };

      // Отправляем ответ в зависимости от платформы
      if (userData.platform === 'telegram' && userData.userId) {
        // Для Telegram отправляем ответ с подписью менеджера
        const messageWithSignature = `${messageText}\n\n_От: ${managerName}_`;
        await this.sendToUser(parseInt(userData.userId), messageWithSignature);
      } else if (userData.platform === 'whatsapp' && this.whatsappService) {
        await this.whatsappService.sendManagerReply(managerReply);
      }
      
      console.log(`Ответ отправлен клиенту ${userData.userId} (${userData.platform}) от менеджера ${from.id}`);
      
    } catch (error) {
      console.error('Ошибка обработки ответа менеджера:', error);
    }
  }
  
  // Форматирование подписи менеджера
  private formatManagerSignature(manager: any): string {
    const firstName = manager.first_name || '';
    const lastName = manager.last_name || '';
    const username = manager.username;
    
    let signature = '';
    
    if (firstName || lastName) {
      signature = `${firstName} ${lastName}`.trim();
    } else {
      signature = 'Менеджер';
    }
    
    if (username) {
      signature += ` (@${username})`;
    }
    
    return signature;
  }

  // Метод для отправки ответов пользователям (для Telegram)
  async sendToUser(userId: number, message: string): Promise<void> {
    try {
      await this.bot.api.sendMessage(userId, message, { parse_mode: 'Markdown' });
      console.log(`Сообщение успешно отправлено пользователю ${userId}`);
    } catch (error: any) {
      console.error(`Ошибка отправки сообщения пользователю ${userId}:`, error);
      
      // Если ошибка связана с форматированием Markdown, попробуем отправить без форматирования
      if (error.description && error.description.includes('parse')) {
        try {
          const plainMessage = message.replace(/\*([^*]+)\*/g, '$1'); // Убираем Markdown форматирование
          await this.bot.api.sendMessage(userId, plainMessage);
          console.log(`Сообщение отправлено пользователю ${userId} без форматирования`);
        } catch (retryError) {
          console.error(`Ошибка повторной отправки пользователю ${userId}:`, retryError);
        }
      }
    }
  }


  start(): void {
    this.bot.start();
    console.log('Telegram бот запущен');
    if (this.whatsappService) {
      this.whatsappService.start();
    }
  }

  stop(): void {
    if (this.whatsappService) {
      this.whatsappService.stop();
    }
  }
}