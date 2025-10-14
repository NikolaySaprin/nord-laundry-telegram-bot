#!/bin/bash

# VPS WhatsApp Auth Reset Script
# Используйте этот скрипт для полной очистки WhatsApp авторизации на VPS

echo "🔧 VPS: Полная очистка WhatsApp авторизации"
echo "============================================="
echo ""

# Проверка что мы на VPS (проверяем наличие PM2)
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 не найден. Вы уверены что это VPS?"
    read -p "Продолжить? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Показываем текущее состояние
echo "📊 Текущее состояние:"
pm2 list 2>/dev/null || echo "PM2 процессы не найдены"
echo ""

# Остановка всех PM2 процессов
echo "⏹️  Остановка всех PM2 процессов..."
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
echo "✅ PM2 процессы остановлены"
sleep 2

# Убиваем все Node процессы (на всякий случай)
echo "🔪 Завершение всех Node процессов..."
pkill -9 node 2>/dev/null || echo "Активных Node процессов не найдено"
sleep 2

# Удаляем папку сессий
echo "🗑️  Удаление .wwebjs_auth/..."
if [ -d ".wwebjs_auth" ]; then
    rm -rf .wwebjs_auth/
    echo "✅ Папка удалена"
else
    echo "⚠️  Папка не найдена"
fi

# Удаляем все архивы
echo "🗑️  Удаление всех архивов WhatsApp..."
rm -f whatsapp_auth_*.tar.gz 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Архивы удалены"
else
    echo "⚠️  Архивы не найдены"
fi

# Удаляем из Git (если был добавлен)
echo "🗑️  Удаление из Git кэша..."
git rm --cached whatsapp_auth_latest.tar.gz 2>/dev/null || echo "Файл не в Git"
git rm --cached .wwebjs_auth/ 2>/dev/null || echo "Папка не в Git"

# Удаляем Chromium/Puppeteer кэши
echo "🗑️  Очистка Chromium/Puppeteer кэшей..."
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null
rm -rf /tmp/puppeteer_dev_chrome_profile-* 2>/dev/null
rm -rf ~/.config/chromium/ 2>/dev/null
rm -rf /tmp/chrome-* 2>/dev/null
echo "✅ Кэши очищены"

# Очистка PM2 логов и данных
echo "🗑️  Очистка PM2 логов..."
pm2 flush 2>/dev/null
rm -rf ~/.pm2/logs/* 2>/dev/null
echo "✅ Логи очищены"

# Очистка системных временных файлов
echo "🗑️  Очистка системных temp файлов..."
rm -rf /tmp/wwebjs_* 2>/dev/null
rm -rf /tmp/puppeteer* 2>/dev/null
echo "✅ Temp файлы очищены"

echo ""
echo "======================================"
echo "✅ Полная очистка завершена!"
echo "======================================"
echo ""

# Проверка результата
echo "📋 Проверка результата:"
ERRORS=0

if [ -d ".wwebjs_auth" ]; then
    echo "❌ .wwebjs_auth/ всё ещё существует!"
    ERRORS=$((ERRORS+1))
else
    echo "✅ .wwebjs_auth/ удалена"
fi

if ls whatsapp_auth_*.tar.gz 1> /dev/null 2>&1; then
    echo "❌ Найдены архивы whatsapp_auth_*.tar.gz"
    ls -lh whatsapp_auth_*.tar.gz
    ERRORS=$((ERRORS+1))
else
    echo "✅ Архивы удалены"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 Всё чисто! Теперь можно авторизовать новый номер"
else
    echo "⚠️  Обнаружены проблемы. Проверьте вывод выше."
fi

echo ""
echo "📱 Для авторизации нового номера:"
echo "   1. Соберите проект: npm run build"
echo "   2. Запустите бот: pm2 start bot-runner.mjs --name laundry-bot"
echo "   3. Смотрите логи: pm2 logs laundry-bot"
echo "   4. Отсканируйте QR код для нового номера"
echo ""
echo "💡 Для просмотра QR кода в логах используйте:"
echo "   pm2 logs laundry-bot --lines 100"
echo ""
