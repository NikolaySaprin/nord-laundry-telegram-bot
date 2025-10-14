#!/bin/bash

echo "🔧 Полная очистка WhatsApp авторизации"
echo "======================================"

# Остановка бота
echo "⏹️  Остановка бота..."
pm2 stop all 2>/dev/null || echo "PM2 не запущен"

# Ждем полной остановки
sleep 3

# Удаляем папку сессий
echo "🗑️  Удаление папки .wwebjs_auth/..."
rm -rf .wwebjs_auth/

# Удаляем архив
echo "🗑️  Удаление архива whatsapp_auth_latest.tar.gz..."
rm -f whatsapp_auth_latest.tar.gz

# Удаляем из Git кэша (если был закоммичен)
echo "🗑️  Удаление из Git..."
git rm --cached whatsapp_auth_latest.tar.gz 2>/dev/null || echo "Файл не в Git"

# Удаляем Puppeteer кэши
echo "🗑️  Очистка Puppeteer кэшей..."
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null
rm -rf /tmp/puppeteer_dev_chrome_profile-* 2>/dev/null

# Очистка PM2 логов
echo "🗑️  Очистка PM2 логов..."
pm2 flush 2>/dev/null || echo "PM2 не настроен"

# Проверка что всё удалено
echo ""
echo "✅ Проверка результата:"
if [ -d ".wwebjs_auth" ]; then
    echo "❌ Папка .wwebjs_auth/ всё ещё существует!"
else
    echo "✅ Папка .wwebjs_auth/ удалена"
fi

if [ -f "whatsapp_auth_latest.tar.gz" ]; then
    echo "❌ Архив whatsapp_auth_latest.tar.gz всё ещё существует!"
else
    echo "✅ Архив whatsapp_auth_latest.tar.gz удалён"
fi

echo ""
echo "📋 Теперь запустите бота:"
echo "   npm run build && pm2 start bot-runner.mjs --name laundry-bot"
echo ""
echo "📱 При запуске появится QR код для авторизации нового номера"
