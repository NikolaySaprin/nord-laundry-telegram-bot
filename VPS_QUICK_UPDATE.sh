#!/bin/bash

echo "🚀 Быстрое обновление nord-laundry-bot"
echo "=========================================="
echo ""

if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден"
    exit 1
fi

echo "📥 Получение последних изменений..."
git pull origin main

echo ""
echo "🔨 Сборка TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке!"
    exit 1
fi

echo ""
echo "🔄 Перезапуск бота..."
pm2 restart nord-laundry-bot

if [ $? -ne 0 ]; then
    echo "⚠️  Бот не найден в PM2, запускаем..."
    pm2 start bot-runner.mjs --name nord-laundry-bot
    pm2 save
fi

echo ""
echo "⏳ Ожидание инициализации..."
sleep 5

echo ""
echo "📋 Последние логи:"
echo "=========================================="
pm2 logs nord-laundry-bot --lines 30 --nostream
echo "=========================================="
echo ""
echo "✅ Готово!"
echo ""
echo "💡 Следите за логами: pm2 logs nord-laundry-bot"
echo "📱 Отправьте тестовое сообщение в WhatsApp"
