#!/bin/bash

# Скрипт для тестирования долгосрочной работы WhatsApp сессии

echo "🧪 Тестирование долгосрочной работы WhatsApp сессии..."

# Функция для проверки состояния бота
check_bot_status() {
    echo "📊 Проверка состояния бота..."
    
    # Проверяем процессы PM2
    if command -v pm2 >/dev/null 2>&1; then
        echo "🔄 Статус PM2 процессов:"
        pm2 status
        echo ""
    fi
    
    # Проверяем логи
    if command -v pm2 >/dev/null 2>&1; then
        echo "📋 Последние логи бота:"
        pm2 logs nord-laundry-bot --lines 10 --nostream
        echo ""
    fi
    
    # Проверяем папку авторизации
    if [ -d ".wwebjs_auth" ]; then
        echo "📁 Папка авторизации найдена"
        echo "📊 Размер папки: $(du -sh .wwebjs_auth/ | cut -f1)"
        echo "📊 Количество файлов: $(find .wwebjs_auth/ -type f | wc -l)"
    else
        echo "❌ Папка авторизации не найдена"
    fi
    
    echo ""
}

# Функция для мониторинга в реальном времени
monitor_realtime() {
    echo "👁️ Запуск мониторинга в реальном времени..."
    echo "💡 Нажмите Ctrl+C для остановки мониторинга"
    echo ""
    
    while true; do
        clear
        echo "🕐 $(date)"
        echo "=================================="
        check_bot_status
        
        # Ждем 30 секунд
        sleep 30
    done
}

# Функция для тестирования API
test_api() {
    echo "🌐 Тестирование API endpoint..."
    
    # Проверяем, что webhook-server запущен
    if curl -s http://localhost:3001/api/application >/dev/null 2>&1; then
        echo "✅ API endpoint доступен"
        
        # Отправляем тестовую заявку
        echo "📤 Отправляем тестовую заявку..."
        response=$(curl -s -X POST http://localhost:3001/api/application \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Тест долгосрочной сессии",
                "phone": "+79991234567",
                "source": "website_form",
                "messageType": "text",
                "userMessage": "Тест работы сессии"
            }')
        
        echo "📥 Ответ API: $response"
    else
        echo "❌ API endpoint недоступен"
    fi
}

# Функция для создания архива авторизации
create_backup() {
    echo "💾 Создание резервной копии авторизации..."
    
    if [ -d ".wwebjs_auth" ]; then
        timestamp=$(date +"%Y%m%d_%H%M%S")
        backup_name="whatsapp_auth_backup_${timestamp}.tar.gz"
        
        tar -czf "$backup_name" .wwebjs_auth/
        echo "✅ Резервная копия создана: $backup_name"
    else
        echo "❌ Папка авторизации не найдена"
    fi
}

# Основное меню
case "${1:-menu}" in
    "status")
        check_bot_status
        ;;
    "monitor")
        monitor_realtime
        ;;
    "test-api")
        test_api
        ;;
    "backup")
        create_backup
        ;;
    "full-test")
        echo "🧪 Полный тест долгосрочной сессии..."
        check_bot_status
        test_api
        create_backup
        echo ""
        echo "✅ Полный тест завершен"
        ;;
    *)
        echo "🧪 Тестирование долгосрочной работы WhatsApp сессии"
        echo ""
        echo "Использование: $0 [команда]"
        echo ""
        echo "Команды:"
        echo "  status     - Проверить текущее состояние бота"
        echo "  monitor    - Мониторинг в реальном времени"
        echo "  test-api   - Тестировать API endpoint"
        echo "  backup     - Создать резервную копию авторизации"
        echo "  full-test  - Выполнить полный тест"
        echo ""
        echo "Примеры:"
        echo "  $0 status"
        echo "  $0 monitor"
        echo "  $0 full-test"
        ;;
esac
