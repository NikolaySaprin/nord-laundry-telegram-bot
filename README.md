# Nord Laundry Bot

Объединенный бот для Telegram и WhatsApp для обработки заявок клиентов прачечной Nord Laundry.

## Возможности

- **Telegram Bot**: Обработка личных сообщений и создание тем форума для менеджеров
- **WhatsApp интеграция**: Обработка сообщений через whatsapp-web.js с QR авторизацией
- **Двусторонняя связь**: Ответы менеджеров из Telegram доставляются клиентам в WhatsApp
- **Поддержка медиа**: Обработка изображений, видео, документов и аудио файлов
- **Интеграция с сайтом**: REST API endpoint для приема заявок с форм сайта

## Требования

- Node.js >= 18.x
- npm или yarn
- Telegram Bot Token (от [@BotFather](https://t.me/BotFather))
- Telegram группа с включенными форумами

## Установка

```bash
npm install
```

## Конфигурация

Создайте файл `.env` на основе `env.example`:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_GROUP_CHAT_ID=id_вашей_группы
ENABLE_WHATSAPP=true
NODE_ENV=production
```

### Настройка Telegram

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Добавьте бота в группу и назначьте администратором
3. Включите форумы в настройках группы
4. Получите ID группы (используйте [@userinfobot](https://t.me/userinfobot))

### Настройка WhatsApp

1. Установите `ENABLE_WHATSAPP=true` в `.env`
2. Запустите `npm start` и отсканируйте QR код
3. Сессия будет сохранена в директории `.wwebjs_auth`

## Использование

### Разработка

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

### Первоначальная настройка

```bash
./VPS_INSTALL_DEPS.sh
```

Этот скрипт устанавливает все необходимые зависимости, включая Chromium для WhatsApp Web.

### Быстрое исправление

Если возникли проблемы с WhatsApp:

```bash
./VPS_QUICK_FIX.sh
```

### Перенос сессии

1. После локальной авторизации скопируйте папку `.wwebjs_auth` на VPS
2. Или используйте созданный архив `whatsapp_auth_latest.tar.gz`
3. Распакуйте на VPS: `tar -xzf whatsapp_auth_latest.tar.gz`

## API Endpoints

### POST /api/application

Прием заявок с форм сайта.

**Запрос:**
```json
{
  "name": "Имя клиента",
  "phone": "+7 (999) 123-45-67",
  "sphere": "Гостиничный бизнес",
  "source": "website_form",
  "messageType": "text"
}
```

**Ответ:**
```json
{
  "status": "success",
  "message": "Application processed"
}
```

## Структура проекта

```
src/
├── lib/
│   ├── telegram-bot.ts      # Основной класс бота
│   └── whatsapp-service.ts  # WhatsApp интеграция
└── types/
    └── application-types.ts # Определения типов

bot-runner.mjs              # Точка входа
webhook-server.mjs          # HTTP сервер для интеграции с сайтом
shared-bot.mjs              # Общий экземпляр бота
ecosystem.config.cjs        # PM2 конфигурация
```

## Лицензия

MIT