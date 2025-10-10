# Nord Laundry Unified Bot

Объединенный бот для Telegram и WhatsApp, предназначенный для обработки заявок клиентов прачечной Nord Laundry.

## Возможности

- **Telegram Bot**: Обработка личных сообщений и создание тем форума для менеджеров
- **WhatsApp Bot**: Интеграция через whatsapp-web.js с QR авторизацией
- **Двусторонняя связь**: Ответы менеджеров из Telegram доставляются клиентам в WhatsApp
- **Медиа поддержка**: Обработка изображений, видео, документов и аудио
- **Форумы**: Автоматическое создание тем для каждой заявки

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd nord-laundry-bot
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `env.example`:
```bash
cp env.example .env
```

4. Настройте переменные окружения в `.env`:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_GROUP_CHAT_ID=your_telegram_group_chat_id_here
ENABLE_WHATSAPP=true
```

## Настройка Telegram

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Добавьте бота в группу и сделайте администратором
3. Включите форумы в группе (если нужно)
4. Получите ID группы (можно через [@userinfobot](https://t.me/userinfobot))

## Настройка WhatsApp

1. Установите `ENABLE_WHATSAPP=true` в `.env`
2. Запустите бота: `npm start`
3. Отсканируйте QR код, который появится в терминале
4. Сессия будет сохранена в папке `.wwebjs_auth`

## Запуск

### Локальная разработка
```bash
npm run build
npm start
```

### Продакшн (PM2)
```bash
npm run build
pm2 start ecosystem.config.cjs
```

## Развертывание на VPS

1. Скопируйте проект на сервер
2. Установите зависимости: `npm install`
3. Настройте `.env` файл
4. Скомпилируйте: `npm run build`
5. Запустите через PM2: `pm2 start ecosystem.config.cjs`

### Перенос WhatsApp сессии на VPS

1. После авторизации на локальной машине скопируйте папку `.wwebjs_auth` на сервер
2. Убедитесь, что права доступа корректны: `chmod -R 755 .wwebjs_auth`
3. Запустите бота на сервере

## Структура проекта

```
src/
├── lib/
│   ├── telegram-bot.ts      # Основной класс бота
│   └── whatsapp-service.ts  # WhatsApp интеграция
├── types/
│   └── application-types.ts # Типы данных
bot-runner.mjs              # Точка входа
ecosystem.config.cjs        # PM2 конфигурация
```

## API

### ApplicationBot

Основной класс для управления ботом.

```typescript
const bot = new ApplicationBot(
  telegramToken,
  groupChatId,
  enableWhatsApp
);
```

### WhatsAppService

Сервис для работы с WhatsApp.

```typescript
const whatsappService = new WhatsAppService();
whatsappService.setApplicationHandler(handler);
```

### Webhook API для сайта

Бот предоставляет API endpoint для приема заявок с сайта:

**URL:** `POST /api/application`

```javascript
// Пример отправки заявки с сайта
fetch('http://your-vps-ip:3001/api/application', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "Иван Петров",
    phone: "+7 (999) 123-45-67",
    sphere: "Прачечная",
    source: "website_form",
    userMessage: "Нужна стирка постельного белья",
    messageType: "text"
  })
});
```

Подробная документация API доступна в файле [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Логирование

Бот ведет подробные логи всех операций:
- Входящие сообщения
- Создание тем форума
- Ответы менеджеров
- Ошибки и предупреждения

## Устранение неполадок

### WhatsApp не подключается
- Проверьте интернет соединение
- Удалите папку `.wwebjs_auth` и переавторизуйтесь
- Убедитесь, что WhatsApp Web не открыт в браузере

### Telegram конфликты
- Убедитесь, что запущен только один экземпляр бота
- Проверьте правильность токена и ID группы

### Ошибки Puppeteer
- Обновите Chrome/Chromium
- Проверьте системные требования
- Увеличьте лимиты памяти если нужно

## Лицензия

MIT