#!/bin/bash

echo "🔄 Восстановление авторизации WhatsApp на VPS..."

# Проверяем, что передан архив
if [ -z "$1" ]; then
    echo "❌ Укажите путь к архиву авторизации"
    echo "💡 Использование: ./restore-auth.sh whatsapp_auth_YYYYMMDD_HHMMSS.tar.gz"
    exit 1
fi

ARCHIVE_PATH="$1"

# Проверяем, что архив существует
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "❌ Архив не найден: $ARCHIVE_PATH"
    exit 1
fi

echo "📁 Восстанавливаем из архива: $ARCHIVE_PATH"

# Останавливаем бота, если он запущен
if pgrep -f "node bot-runner" > /dev/null; then
    echo "🛑 Останавливаем бота..."
    pkill -f "node bot-runner"
    sleep 2
fi

# Удаляем старую папку авторизации, если есть
if [ -d ".wwebjs_auth" ]; then
    echo "🗑️ Удаляем старую папку авторизации..."
    rm -rf .wwebjs_auth
fi

# Распаковываем архив
echo "📦 Распаковываем архив..."
tar -xzf "$ARCHIVE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Архив распакован успешно"
    
    # Устанавливаем правильные права доступа
    echo "🔐 Устанавливаем права доступа..."
    chmod -R 755 .wwebjs_auth/
    
    # Проверяем содержимое
    echo "📊 Содержимое папки авторизации:"
    ls -la .wwebjs_auth/
    
    echo ""
    echo "✅ Авторизация восстановлена!"
    echo "🚀 Теперь можно запустить бота: npm start"
    echo ""
    echo "💡 Проверьте:"
    echo "- Файл .env настроен правильно"
    echo "- Все зависимости установлены: npm install"
    echo "- Бот запускается без ошибок"
else
    echo "❌ Ошибка при распаковке архива"
    exit 1
fi

