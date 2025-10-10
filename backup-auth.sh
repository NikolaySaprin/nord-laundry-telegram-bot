#!/bin/bash

echo "📦 Создание архива папки авторизации WhatsApp..."

# Проверяем, что папка авторизации существует
if [ ! -d ".wwebjs_auth" ]; then
    echo "❌ Папка .wwebjs_auth не найдена"
    echo "💡 Сначала запустите бота и авторизуйтесь: npm start"
    exit 1
fi

# Создаем архив с текущей датой
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="whatsapp_auth_${TIMESTAMP}.tar.gz"

echo "📁 Создаем архив: $ARCHIVE_NAME"
tar -czf "$ARCHIVE_NAME" .wwebjs_auth/

if [ $? -eq 0 ]; then
    echo "✅ Архив создан успешно: $ARCHIVE_NAME"
    echo "📊 Размер архива: $(du -sh "$ARCHIVE_NAME" | awk '{print $1}')"
    echo ""
    echo "📋 Инструкции для переноса на VPS:"
    echo ""
    echo "1. 📤 Загрузите архив на VPS:"
    echo "   scp $ARCHIVE_NAME user@your-vps-ip:/path/to/your/bot/"
    echo ""
    echo "2. 🔧 На VPS распакуйте архив:"
    echo "   cd /path/to/your/bot/"
    echo "   tar -xzf $ARCHIVE_NAME"
    echo ""
    echo "3. 🔐 Установите правильные права доступа:"
    echo "   chmod -R 755 .wwebjs_auth/"
    echo "   chown -R your-user:your-group .wwebjs_auth/"
    echo ""
    echo "4. 🚀 Запустите бота на VPS:"
    echo "   npm start"
    echo ""
    echo "💡 Важно:"
    echo "- Убедитесь, что на VPS установлены те же зависимости"
    echo "- Проверьте, что .env файл настроен правильно"
    echo "- Папка .wwebjs_auth должна быть в корне проекта бота"
else
    echo "❌ Ошибка при создании архива"
    exit 1
fi

