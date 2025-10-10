#!/bin/bash

echo "📊 Мониторинг состояния сессии WhatsApp..."

# Функция для проверки состояния
check_session() {
    echo "🔍 Проверка состояния сессии..."
    
    # Проверяем папку сессии
    if [ -d ".wwebjs_auth" ]; then
        echo "✅ Папка сессии существует"
        
        # Проверяем размер папки
        size=$(du -sh .wwebjs_auth | cut -f1)
        echo "📊 Размер папки сессии: $size"
        
        # Проверяем последнее изменение
        last_modified=$(stat -f "%Sm" .wwebjs_auth)
        echo "📅 Последнее изменение: $last_modified"
        
        # Проверяем содержимое
        if [ "$(ls -A .wwebjs_auth)" ]; then
            echo "✅ Папка сессии не пустая"
            echo "📁 Файлы в сессии:"
            ls -la .wwebjs_auth/
        else
            echo "⚠️ Папка сессии пустая"
        fi
    else
        echo "❌ Папка сессии не существует"
    fi
    
    # Проверяем запущенные процессы
    echo ""
    echo "🔄 Проверка процессов:"
    if pgrep -f "node.*bot-runner" > /dev/null; then
        echo "✅ Бот запущен"
        echo "📋 PID процесса:"
        pgrep -f "node.*bot-runner"
    else
        echo "❌ Бот не запущен"
    fi
    
    echo ""
    echo "⏰ Время проверки: $(date)"
    echo "----------------------------------------"
}

# Запускаем мониторинг
if [ "$1" = "--continuous" ]; then
    echo "🔄 Запуск непрерывного мониторинга (каждые 30 секунд)..."
    echo "💡 Нажмите Ctrl+C для остановки"
    echo ""
    
    while true; do
        check_session
        sleep 30
    done
else
    check_session
fi
