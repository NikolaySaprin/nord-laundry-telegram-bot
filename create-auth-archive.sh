#!/bin/bash

# Скрипт для создания архива авторизации WhatsApp для переноса на VPS

echo "📦 Создание архива авторизации WhatsApp..."

# Проверяем наличие папки авторизации
if [ ! -d ".wwebjs_auth" ]; then
    echo "❌ Папка .wwebjs_auth не найдена!"
    echo "💡 Убедитесь, что WhatsApp бот был авторизован"
    exit 1
fi

# Создаем временную метку
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="whatsapp_auth_${TIMESTAMP}.tar.gz"

echo "📁 Создаем архив: ${ARCHIVE_NAME}"

# Создаем архив
tar -czf "${ARCHIVE_NAME}" .wwebjs_auth/

if [ $? -eq 0 ]; then
    # Получаем размер архива
    SIZE=$(du -h "${ARCHIVE_NAME}" | cut -f1)
    echo "✅ Архив создан успешно: ${ARCHIVE_NAME} (${SIZE})"
    echo ""
    echo "📋 Инструкции для переноса на VPS:"
    echo "1. Скопируйте файл ${ARCHIVE_NAME} на VPS"
    echo "2. На VPS выполните: tar -xzf ${ARCHIVE_NAME}"
    echo "3. Установите права: chmod -R 755 .wwebjs_auth/"
    echo "4. Перезапустите бота: pm2 restart nord-laundry-bot"
    echo ""
    echo "💡 Альтернативно используйте scp для копирования:"
    echo "scp ${ARCHIVE_NAME} root@your-vps-ip:/path/to/project/"
else
    echo "❌ Ошибка при создании архива"
    exit 1
fi
