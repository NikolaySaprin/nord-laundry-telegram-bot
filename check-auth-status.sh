#!/bin/bash

echo "🔍 Проверка состояния авторизации WhatsApp..."

# Проверяем, запущен ли бот
if pgrep -f "node bot-runner" > /dev/null; then
    echo "✅ Бот запущен"
    BOT_PID=$(pgrep -f "node bot-runner")
    echo "📋 PID процесса: $BOT_PID"
else
    echo "❌ Бот не запущен"
    echo "💡 Запустите: npm start"
    exit 1
fi

# Проверяем папку авторизации
AUTH_DIR=".wwebjs_auth"
if [ -d "$AUTH_DIR" ]; then
    echo "✅ Папка авторизации существует"
    
    # Проверяем размер папки
    SIZE=$(du -sh "$AUTH_DIR" 2>/dev/null | awk '{print $1}')
    echo "📊 Размер папки авторизации: $SIZE"
    
    # Проверяем содержимое
    if [ "$(ls -A "$AUTH_DIR" 2>/dev/null)" ]; then
        echo "✅ Папка авторизации не пустая"
        echo "📁 Содержимое:"
        ls -la "$AUTH_DIR"
    else
        echo "⚠️ Папка авторизации пустая - нужна авторизация"
    fi
else
    echo "❌ Папка авторизации не существует - нужна авторизация"
fi

echo ""
echo "📋 Инструкции:"
echo "1. Если папка авторизации пустая или не существует:"
echo "   - Отсканируйте QR код в терминале где запущен бот"
echo "   - Или откройте ссылку с QR кодом в браузере"
echo ""
echo "2. Если папка авторизации существует и не пустая:"
echo "   - Авторизация уже пройдена"
echo "   - Бот готов к работе"
echo ""
echo "3. Для очистки авторизации:"
echo "   - Остановите бота (Ctrl+C)"
echo "   - Запустите: npm run clear-session"
echo "   - Запустите: npm start"
