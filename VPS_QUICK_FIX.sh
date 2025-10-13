#!/bin/bash

# Быстрое исправление бесконечных перезапусков WhatsApp на VPS
# Версия: 1.4.1
# Дата: 2025-10-13

echo "🔧 Быстрое исправление WhatsApp на VPS"
echo "======================================"
echo ""

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: Запустите скрипт из директории проекта"
    exit 1
fi

# Шаг 1: Останавливаем бота
echo "1️⃣ Останавливаем бота..."
pm2 stop nord-laundry-bot || echo "⚠️ Бот не был запущен"

# Шаг 2: Проверяем наличие сессии
echo ""
echo "2️⃣ Проверяем сессию WhatsApp..."
if [ -d ".wwebjs_auth/session-nord-laundry-whatsapp" ]; then
    echo "✅ Сессия найдена"
    ls -lh .wwebjs_auth/session-nord-laundry-whatsapp/ | head -5
else
    echo "⚠️ Сессия не найдена!"
    
    # Пытаемся восстановить из архива
    if [ -f "whatsapp_auth_latest.tar.gz" ]; then
        echo "📦 Восстанавливаем из архива..."
        tar -xzf whatsapp_auth_latest.tar.gz
        chmod -R 755 .wwebjs_auth/
        echo "✅ Сессия восстановлена из архива"
    else
        echo "❌ Архив не найден! Потребуется QR авторизация"
        echo "💡 Скопируйте whatsapp_auth_latest.tar.gz с локальной машины"
    fi
fi

# Шаг 3: Устанавливаем права доступа
echo ""
echo "3️⃣ Настраиваем права доступа..."
if [ -d ".wwebjs_auth" ]; then
    chmod -R 755 .wwebjs_auth/
    chown -R $(whoami):$(whoami) .wwebjs_auth/ 2>/dev/null || true
    echo "✅ Права доступа настроены"
fi

# Шаг 4: Перезапускаем бота
echo ""
echo "4️⃣ Перезапускаем бота..."
pm2 restart nord-laundry-bot || pm2 start ecosystem.config.cjs

# Шаг 5: Ждем инициализации
echo ""
echo "5️⃣ Ожидаем инициализации (30 секунд)..."
sleep 30

# Шаг 6: Проверяем логи
echo ""
echo "6️⃣ Проверяем состояние WhatsApp..."
echo "======================================"
pm2 logs nord-laundry-bot --lines 20 --nostream | grep -E "(WhatsApp|готов|перезапуск|ошибка)" || true

echo ""
echo "======================================"
echo "✅ Исправление применено!"
echo ""
echo "📊 Что дальше:"
echo "   1. Проверьте логи: pm2 logs nord-laundry-bot"
echo "   2. Дождитесь сообщения: ✅ WhatsApp бот готов к работе!"
echo "   3. Отправьте тестовое сообщение в WhatsApp"
echo "   4. Убедитесь, что заявка попала в Telegram"
echo ""
echo "🆘 Если проблемы остались:"
echo "   - Посмотрите VPS_RESTART_FIX.md"
echo "   - Проверьте: pm2 logs nord-laundry-bot | grep 'перезапуск'"
echo "   - Не должно быть циклических перезапусков"
echo ""
