#!/bin/bash

# Скрипт для очистки старых архивов WhatsApp авторизации

echo "🧹 Очистка старых архивов WhatsApp авторизации..."

# Удаляем все старые архивы с временными метками, оставляя только latest
echo "🗑️ Удаляем старые архивы с временными метками..."
find . -name "whatsapp_auth_2025-*.tar.gz" -type f -delete 2>/dev/null || true

# Подсчитываем количество удаленных файлов
deleted_count=$(find . -name "whatsapp_auth_2025-*.tar.gz" -type f 2>/dev/null | wc -l)

if [ "$deleted_count" -gt 0 ]; then
    echo "✅ Удалено $deleted_count старых архивов"
else
    echo "ℹ️ Старые архивы не найдены"
fi

# Проверяем текущий архив
if [ -f "whatsapp_auth_latest.tar.gz" ]; then
    size=$(ls -lh whatsapp_auth_latest.tar.gz | awk '{print $5}')
    echo "📦 Текущий архив: whatsapp_auth_latest.tar.gz ($size)"
else
    echo "⚠️ Текущий архив не найден"
fi

echo "✅ Очистка завершена"
