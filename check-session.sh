#!/bin/bash

echo "🔍 Проверка состояния сессии WhatsApp..."

# Проверяем существование папки сессии
if [ -d ".wwebjs_auth" ]; then
    echo "✅ Папка сессии существует"
    
    # Проверяем содержимое
    if [ "$(ls -A .wwebjs_auth)" ]; then
        echo "✅ Папка сессии не пустая"
        echo "📁 Содержимое:"
        ls -la .wwebjs_auth/
        
        # Проверяем размер папки
        size=$(du -sh .wwebjs_auth | cut -f1)
        echo "📊 Размер папки сессии: $size"
        
        # Проверяем права доступа
        echo "🔐 Права доступа:"
        ls -ld .wwebjs_auth/
        
    else
        echo "⚠️ Папка сессии пустая"
    fi
else
    echo "❌ Папка сессии не существует"
    echo "💡 Нужно авторизоваться заново"
fi

# Проверяем запущенные процессы
echo ""
echo "🔄 Проверка запущенных процессов:"
if pgrep -f "node.*bot-runner" > /dev/null; then
    echo "✅ Бот запущен"
    echo "📋 Процессы:"
    pgrep -f "node.*bot-runner" | xargs ps -p
else
    echo "❌ Бот не запущен"
fi

echo ""
echo "💡 Рекомендации:"
echo "- Если сессия повреждена, запустите: ./clear-session.sh"
echo "- Если бот не запущен, запустите: npm start"
echo "- Если нужна новая авторизация, отсканируйте QR код"
