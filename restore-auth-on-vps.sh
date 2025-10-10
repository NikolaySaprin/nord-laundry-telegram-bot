#!/bin/bash

# Скрипт для восстановления авторизации WhatsApp на VPS

echo "🔄 Восстановление авторизации WhatsApp на VPS..."

# Ищем архивы авторизации
AUTH_ARCHIVES=$(ls whatsapp_auth_*.tar.gz 2>/dev/null | head -1)

if [ -z "$AUTH_ARCHIVES" ]; then
    echo "❌ Архивы авторизации не найдены!"
    echo "💡 Убедитесь, что файл whatsapp_auth_*.tar.gz находится в текущей директории"
    exit 1
fi

echo "📦 Найден архив: ${AUTH_ARCHIVES}"

# Останавливаем бота
echo "⏹️ Останавливаем бота..."
pm2 stop nord-laundry-bot

# Создаем резервную копию существующей авторизации (если есть)
if [ -d ".wwebjs_auth" ]; then
    BACKUP_NAME=".wwebjs_auth_backup_$(date +%Y%m%d_%H%M%S)"
    echo "💾 Создаем резервную копию существующей авторизации: ${BACKUP_NAME}"
    mv .wwebjs_auth "${BACKUP_NAME}"
fi

# Распаковываем архив
echo "📂 Распаковываем архив авторизации..."
tar -xzf "${AUTH_ARCHIVES}"

if [ $? -eq 0 ]; then
    echo "✅ Архив распакован успешно"
    
    # Устанавливаем правильные права
    echo "🔐 Устанавливаем права доступа..."
    chmod -R 755 .wwebjs_auth/
    
    # Проверяем содержимое
    echo "📋 Содержимое папки авторизации:"
    ls -la .wwebjs_auth/
    
    # Перезапускаем бота
    echo "🚀 Перезапускаем бота..."
    pm2 start nord-laundry-bot
    
    # Проверяем статус
    echo "📊 Статус бота:"
    pm2 status nord-laundry-bot
    
    echo ""
    echo "✅ Авторизация восстановлена успешно!"
    echo "💡 Проверьте логи: pm2 logs nord-laundry-bot --lines 20"
    
else
    echo "❌ Ошибка при распаковке архива"
    exit 1
fi
