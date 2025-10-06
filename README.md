# Nord Laundry Telegram Bot

Telegram бот для обработки заявок с сайта Nord Laundry.

## Описание

Бот принимает сообщения от пользователей в личных чатах и создает темы в групповом чате для обработки заявок менеджерами.

## Функциональность

- ✅ Обработка команды `/start`
- ✅ Прием текстовых сообщений от пользователей
- ✅ Создание тем в групповом чате для каждой заявки
- ✅ Отправка уведомлений менеджерам
- ✅ Обработка повторных сообщений от одного пользователя

## Технологии

- **Node.js** - среда выполнения
- **TypeScript** - типизированный JavaScript
- **Grammy** - библиотека для работы с Telegram Bot API
- **dotenv** - управление переменными окружения

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

3. Настройте переменные окружения:
```bash
cp env.example .env
# Отредактируйте .env и добавьте ваши токены
```

**Содержимое файла `.env`:**
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_GROUP_CHAT_ID=your_group_chat_id_here
```

## Запуск

### Разработка
```bash
npm run build:watch  # Компиляция TypeScript в режиме наблюдения
npm run dev          # Запуск бота в режиме разработки
```

### Продакшн
```bash
npm run build        # Компиляция TypeScript
npm start            # Запуск бота
```

## Структура проекта

```
├── src/
│   ├── lib/
│   │   └── telegram-bot.ts      # Основная логика бота
│   └── types/
│       └── application-types.ts # Типы для заявок
├── dist/                        # Скомпилированные файлы
├── bot-runner.mjs              # Точка входа
├── package.json
├── tsconfig.json
└── README.md
```

## Переменные окружения

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | Да |
| `TELEGRAM_GROUP_CHAT_ID` | ID группового чата для заявок | Да |

## Развертывание

### PM2

1. Установите PM2:
```bash
npm install -g pm2
```

2. Запустите бота:
```bash
pm2 start ecosystem.config.js
```

3. Настройте автозапуск:
```bash
pm2 startup
pm2 save
```

### Docker (опционально)

```bash
docker build -t nord-laundry-bot .
docker run -d --name nord-laundry-bot --env-file .env nord-laundry-bot
```

## Логи

Логи сохраняются в папке `logs/`:
- `bot-out.log` - стандартный вывод
- `bot-error.log` - ошибки

## Мониторинг

```bash
# Просмотр логов
pm2 logs nord-laundry-bot

# Статус процессов
pm2 status

# Перезапуск бота
pm2 restart nord-laundry-bot
```

## Лицензия

MIT
