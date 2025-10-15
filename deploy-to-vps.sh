#!/bin/bash

# Quick deployment script for VPS
# Copies necessary files and restarts the bot

echo "📦 Быстрое развертывание на VPS"
echo "================================"
echo ""

# VPS Configuration
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/var/www/html/nord-laundry-telegram-bot}"

# Check if we have all variables
if [ "$VPS_HOST" = "your-vps-ip" ]; then
    echo "❌ Пожалуйста, установите переменные окружения:"
    echo "   export VPS_HOST=your-vps-ip"
    echo "   export VPS_USER=root"
    echo "   export VPS_PATH=/var/www/html/nord-laundry-telegram-bot"
    exit 1
fi

echo "🎯 Цель: $VPS_USER@$VPS_HOST:$VPS_PATH"
echo ""

# Step 1: Build TypeScript
echo "1️⃣ Компиляция TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции"
    exit 1
fi
echo "✅ Компиляция успешна"
echo ""

# Step 2: Copy dist files
echo "2️⃣ Копирование скомпилированных файлов..."
scp -r dist/ $VPS_USER@$VPS_HOST:$VPS_PATH/
if [ $? -ne 0 ]; then
    echo "❌ Ошибка копирования dist/"
    exit 1
fi
echo "✅ dist/ скопирован"
echo ""

# Step 3: Copy updated scripts
echo "3️⃣ Копирование обновленных скриптов..."
scp VPS_COMPLETE_SETUP.sh $VPS_USER@$VPS_HOST:$VPS_PATH/
scp VPS_INSTALL_DEPS.sh $VPS_USER@$VPS_HOST:$VPS_PATH/
scp cleanup-chromium-dirs.sh $VPS_USER@$VPS_HOST:$VPS_PATH/
scp VPS_TROUBLESHOOTING.md $VPS_USER@$VPS_HOST:$VPS_PATH/
echo "✅ Скрипты скопированы"
echo ""

# Step 4: Make scripts executable
echo "4️⃣ Настройка прав доступа..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && chmod +x *.sh"
echo "✅ Права доступа настроены"
echo ""

# Step 5: Restart bot
echo "5️⃣ Перезапуск бота на VPS..."
ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && pm2 restart nord-laundry-bot"
echo "✅ Бот перезапущен"
echo ""

# Step 6: Show logs
echo "6️⃣ Логи бота (последние 20 строк):"
echo "================================"
ssh $VPS_USER@$VPS_HOST "pm2 logs nord-laundry-bot --lines 20 --nostream"
echo ""

echo "================================"
echo "✅ Развертывание завершено!"
echo ""
echo "📊 Полезные команды:"
echo "   Логи: ssh $VPS_USER@$VPS_HOST 'pm2 logs nord-laundry-bot'"
echo "   Статус: ssh $VPS_USER@$VPS_HOST 'pm2 status'"
echo "   Рестарт: ssh $VPS_USER@$VPS_HOST 'pm2 restart nord-laundry-bot'"
echo ""
