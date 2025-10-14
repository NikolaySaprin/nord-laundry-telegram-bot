#!/bin/bash

# Скрипт для диагностики проблем с WhatsApp на VPS
# Использование: bash VPS_DEBUG_WHATSAPP.sh

echo "🔍 Диагностика состояния WhatsApp бота на VPS"
echo "=============================================="
echo ""

# Проверка процессов PM2
echo "📊 Проверка состояния PM2 процессов..."
pm2 list
echo ""

# Проверка логов бота
echo "📋 Последние 50 строк логов бота..."
pm2 logs nord-laundry-bot --lines 50 --nostream
echo ""

# Проверка наличия файлов авторизации
echo "📁 Проверка файлов авторизации WhatsApp..."
if [ -d ".wwebjs_auth" ]; then
    echo "✅ Папка .wwebjs_auth существует"
    echo "📊 Размер папки:"
    du -sh .wwebjs_auth
    echo "📊 Структура папки:"
    ls -lah .wwebjs_auth/
    if [ -d ".wwebjs_auth/session-nord-laundry-whatsapp" ]; then
        echo "✅ Сессия nord-laundry-whatsapp найдена"
        echo "📅 Дата модификации:"
        ls -lah .wwebjs_auth/session-nord-laundry-whatsapp/ | head -5
    else
        echo "❌ Сессия nord-laundry-whatsapp не найдена!"
    fi
else
    echo "❌ Папка .wwebjs_auth не существует!"
fi
echo ""

# Проверка архива
if [ -f "whatsapp_auth_latest.tar.gz" ]; then
    echo "✅ Архив whatsapp_auth_latest.tar.gz существует"
    echo "📊 Размер архива:"
    ls -lh whatsapp_auth_latest.tar.gz
else
    echo "⚠️  Архив whatsapp_auth_latest.tar.gz не найден"
fi
echo ""

# Проверка переменных окружения
echo "🔐 Проверка переменных окружения..."
if [ -f ".env" ]; then
    echo "✅ Файл .env существует"
    echo "📋 Содержимое (без секретов):"
    grep -E "^(ENABLE_WHATSAPP|CREATE_AUTH_ARCHIVE|WHATSAPP_FORCE_RESET)" .env || echo "Переменные WhatsApp не настроены"
else
    echo "❌ Файл .env не найден!"
fi
echo ""

# Проверка Node.js и зависимостей
echo "📦 Проверка Node.js окружения..."
echo "Node версия: $(node -v)"
echo "NPM версия: $(npm -v)"
echo ""

# Проверка Chromium (для puppeteer)
echo "🌐 Проверка Chromium для WhatsApp Web..."
if command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium установлен: $(chromium-browser --version)"
else
    echo "⚠️  Chromium не найден (может потребоваться установка)"
    if command -v google-chrome &> /dev/null; then
        echo "✅ Google Chrome найден: $(google-chrome --version)"
    fi
fi
echo ""

# Проверка портов
echo "🔌 Проверка используемых портов..."
echo "Порты, используемые Node.js процессами:"
netstat -tlnp 2>/dev/null | grep node || ss -tlnp 2>/dev/null | grep node || echo "⚠️  Не удалось получить информацию о портах"
echo ""

echo "=============================================="
echo "✅ Диагностика завершена"
echo ""
echo "💡 Рекомендуемые действия:"
echo "1. Проверьте логи выше на наличие ошибок"
echo "2. Убедитесь, что ENABLE_WHATSAPP=true в .env"
echo "3. Если сессия потеряна, запустите VPS_RESET_WHATSAPP.sh"
echo "4. Отправьте тестовое сообщение в WhatsApp и проверьте логи: pm2 logs nord-laundry-bot"
