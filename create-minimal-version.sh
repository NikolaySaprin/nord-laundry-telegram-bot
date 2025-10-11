#!/bin/bash

# Скрипт для создания минимальной версии проекта для продакшена

MINIMAL_DIR="nord-laundry-bot-minimal"

echo "🚀 Создание минимальной версии проекта..."

# Создаем директорию
mkdir -p "$MINIMAL_DIR"

# Копируем основные файлы
echo "📋 Копируем основные файлы..."
cp package.production.json "$MINIMAL_DIR/package.json"
cp bot-runner.mjs "$MINIMAL_DIR/"
cp webhook-server.js "$MINIMAL_DIR/"
cp shared-bot.js "$MINIMAL_DIR/"
cp tsconfig.json "$MINIMAL_DIR/"
cp .env.example "$MINIMAL_DIR/"

# Копируем исходный код
echo "📁 Копируем исходный код..."
cp -r src/ "$MINIMAL_DIR/"

# Копируем скомпилированный код
echo "🔨 Копируем скомпилированный код..."
cp -r dist/ "$MINIMAL_DIR/"

# Копируем .gitignore для продакшена
echo "📝 Копируем .gitignore для продакшена..."
cp .gitignore.production "$MINIMAL_DIR/.gitignore"

# Создаем README для минимальной версии
echo "📚 Создаем README..."
cat > "$MINIMAL_DIR/README.md" << 'EOF'
# Nord Laundry Bot - Minimal Version

Минимальная версия бота для продакшена.

## Установка

```bash
npm install
npm run build
```

## Запуск

```bash
# Основной бот
npm start

# Webhook сервер (в отдельном терминале)
npm run webhook
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_GROUP_CHAT_ID=your_group_id
ENABLE_WHATSAPP=true
WEBHOOK_SECRET=your_webhook_secret
```

## Функциональность

- ✅ Прием сообщений с сайта, Telegram и WhatsApp
- ✅ Создание новых тредов в Telegram группе
- ✅ Ответы менеджеров в тредах
- ✅ Пересылка ответов в WhatsApp/Telegram
- ✅ Стабильная авторизация WhatsApp
EOF

# Показываем размер
echo "📊 Размер минимальной версии:"
du -sh "$MINIMAL_DIR"

echo "✅ Минимальная версия создана в директории: $MINIMAL_DIR"
echo ""
echo "💡 Для развертывания на VPS:"
echo "  1. Скопируйте папку $MINIMAL_DIR на VPS"
echo "  2. Установите зависимости: npm install"
echo "  3. Скомпилируйте: npm run build"
echo "  4. Настройте .env файл"
echo "  5. Запустите: npm start"
