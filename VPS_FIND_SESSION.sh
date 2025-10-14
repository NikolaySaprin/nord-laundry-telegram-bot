#!/bin/bash

echo "🔍 Поиск всех файлов WhatsApp сессии на VPS"
echo "=============================================="
echo ""

echo "📁 Поиск в текущей директории проекта:"
pwd
echo ""

echo "1️⃣ Проверка .wwebjs_auth/:"
if [ -d ".wwebjs_auth" ]; then
    echo "❌ НАЙДЕНА папка .wwebjs_auth/"
    ls -lah .wwebjs_auth/
    echo ""
    echo "Размер папки:"
    du -sh .wwebjs_auth/
else
    echo "✅ Папка .wwebjs_auth/ не найдена"
fi
echo ""

echo "2️⃣ Проверка архивов:"
if ls whatsapp_auth_*.tar.gz 1> /dev/null 2>&1; then
    echo "❌ НАЙДЕНЫ архивы:"
    ls -lah whatsapp_auth_*.tar.gz
else
    echo "✅ Архивы не найдены"
fi
echo ""

echo "3️⃣ Поиск скрытых файлов whatsapp:"
find . -maxdepth 3 -name "*whatsapp*" -o -name "*wwebjs*" 2>/dev/null | grep -v node_modules | head -20
echo ""

echo "4️⃣ Поиск в /tmp/:"
echo "Puppeteer профили:"
ls -la /tmp/ 2>/dev/null | grep -E "puppeteer|chromium|wwebjs" || echo "✅ Не найдено"
echo ""

echo "5️⃣ Поиск в домашней директории:"
find ~ -maxdepth 2 -name "*wwebjs*" -o -name ".wwebjs_auth" 2>/dev/null || echo "✅ Не найдено"
echo ""

echo "6️⃣ Поиск Chrome/Chromium данных:"
if [ -d "$HOME/.config/chromium" ]; then
    echo "❌ НАЙДЕНА папка ~/.config/chromium/"
    du -sh ~/.config/chromium/
else
    echo "✅ ~/.config/chromium/ не найдена"
fi
echo ""

echo "7️⃣ Проверка PM2 рабочей директории:"
pm2 describe laundry-bot 2>/dev/null | grep "exec cwd" || echo "PM2 процесс не найден"
echo ""

echo "8️⃣ Поиск всех .wwebjs_auth в системе (может занять время):"
echo "Запуск find от корня проекта..."
find . -name ".wwebjs_auth" -type d 2>/dev/null
echo ""

echo "9️⃣ Проверка Git статуса:"
git status | grep -E "wwebjs|whatsapp" || echo "✅ Нет изменений в Git"
echo ""

echo "🔟 Проверка что файлы не в Git репозитории:"
git ls-files | grep -E "wwebjs|whatsapp_auth" || echo "✅ Нет в Git"
echo ""

echo "=============================================="
echo "✅ Поиск завершён"
echo ""
echo "💡 Если нашли файлы сессии - удалите их вручную"
echo "   Затем выполните: pm2 restart laundry-bot"
