#!/bin/bash

# Скрипт быстрого обновления бота на VPS с исправлениями WhatsApp
# Использование: bash VPS_QUICK_UPDATE.sh

echo "🚀 Быстрое обновление nord-laundry-bot на VPS"
echo "=============================================="
echo ""

# Проверка, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: файл package.json не найден"
    echo "Запустите скрипт из корневой директории проекта"
    exit 1
fi

echo "📥 Шаг 1: Получение последних изменений из Git..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "⚠️  Ошибка при git pull, продолжаем..."
fi
echo ""

echo "📦 Шаг 2: Установка зависимостей (если нужно)..."
npm install
echo ""

echo "🔨 Шаг 3: Сборка TypeScript кода..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке!"
    exit 1
fi
echo ""

echo "🔄 Шаг 4: Перезапуск бота через PM2..."
pm2 restart nord-laundry-bot
if [ $? -ne 0 ]; then
    echo "⚠️  Бот не был запущен в PM2, запускаем заново..."
    pm2 start bot-runner.mjs --name nord-laundry-bot
    pm2 save
fi
echo ""

echo "⏳ Ждем 5 секунд для инициализации..."
sleep 5
echo ""

echo "📊 Шаг 5: Проверка состояния бота..."
pm2 list | grep nord-laundry-bot
echo ""

echo "📋 Последние логи бота:"
echo "=============================================="
pm2 logs nord-laundry-bot --lines 30 --nostream
echo "=============================================="
echo ""

echo "✅ Обновление завершено!"
echo ""
echo "💡 Что дальше:"
echo "1. Следите за логами: pm2 logs nord-laundry-bot"
echo "2. Отправьте тестовое сообщение в WhatsApp"
echo "3. Проверьте, что клиент получил благодарность"
echo "4. Проверьте, что заявка появилась в Telegram группе"
echo ""
echo "🔍 Для диагностики запустите:"
echo "   bash VPS_DEBUG_WHATSAPP.sh"
