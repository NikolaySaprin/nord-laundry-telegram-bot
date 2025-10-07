import { Bot, Context } from 'grammy';
import { Application } from '../types/application-types';

export class ApplicationBot {
  private bot: Bot;
  private groupChatId: string;
  private activeThreads: Map<string, number> = new Map(); // Хранит thread_id по идентификатору пользователя

  constructor(token: string, groupChatId: string) {
    if (!token) {
      throw new Error('Telegram bot token is required');
    }
    if (!groupChatId) {
      throw new Error('Group chat ID is required');
    }
    this.groupChatId = groupChatId;
    this.bot = new Bot(token);
    this.setupHandlers();
  }

  private setupHandlers() {
    // Обработчик команды /start для личных сообщений
    this.bot.command('start', async (ctx: Context) => {
      await ctx.reply(`Добро пожаловать! Опишите ваш вопрос, и наши специалисты свяжутся с вами в ближайшее время.`);
    });

    // Обрабатываем все текстовые сообщения в личных чатах
    this.bot.on('message', async (ctx: Context) => {
      if (ctx.chat?.type !== 'private') return;
      
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
        phone: 'Не указан' // В Telegram телефон не доступен по умолчанию
      };

      await this.handleNewApplication(application);
      await ctx.reply("Спасибо за заявку!/nМы свяжется с Вами в ближайшее время");
    });
  }

  async handleNewApplication(application: Application): Promise<void> {
    try {
      const userIdentifier = application.userIdentifierTelegram || `website_${application.phone}`;
      let threadId = this.activeThreads.get(userIdentifier);
      
      if (!threadId) {
        // Создаем новую тему форума
        const topicName = this.generateTopicName(application);
        
        const topic = await this.bot.api.createForumTopic(
          this.groupChatId, 
          topicName
        );
        
        threadId = topic.message_thread_id;
        this.activeThreads.set(userIdentifier, threadId);
        
        // Отправляем первоначальное сообщение о заявке
        const message = this.formatApplicationMessage(application);
        await this.bot.api.sendMessage(
          this.groupChatId, 
          message,
          { message_thread_id: threadId }
        );
      } else {
        // Добавляем в существующую тему
        const message = this.formatNewMessage(application);
        await this.bot.api.sendMessage(
          this.groupChatId,
          message,
          { message_thread_id: threadId }
        );
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
    
    let message: string;
    
    if (application.source === 'telegram_direct') {
      message = `💬 Новая заявка ${sourceLabel}:\n\n👤 Пользователь: ${application.userNameTelegram}${application.userUsernameTelegram ? ` (@${application.userUsernameTelegram})` : ''}\n📝 Вопрос: ${application.userMessage}`;
    } else {
      message = `📋 Новая заявка ${sourceLabel}:\n\n👤 Имя: ${application.name}\n📞 Телефон: ${application.phone}`;
    }
    
    // Добавляем сферу деятельности, если есть
    if (application.sphere) {
      message += `\n🏢 Сфера: ${application.sphere}`;
    }
    
    message += `\n⏰ Время: ${new Date().toLocaleString('ru-RU')}\n\nСтатус: ⏳ Ожидает обработки`;
    
    return message;
  }

  private formatNewMessage(application: Application): string {
    return `📝 Новое сообщение в заявке:\n\n${application.userMessage || 'Без текста'}\n⏰ Время: ${new Date().toLocaleString('ru-RU')}`;
  }

  // Метод для отправки ответов пользователям (для Telegram)
  async sendToUser(userId: number, message: string): Promise<void> {
    try {
      await this.bot.api.sendMessage(userId, message);
    } catch (error) {
      console.error('Ошибка отправки сообщения пользователю:', error);
    }
  }

  start(): void {
    this.bot.start();
    console.log('Telegram бот запущен');
  }
}