#!/bin/bash

# Cleanup script for Chromium temporary directories
# This script removes old temporary Chromium directories created by WhatsApp client

echo "🧹 Очистка временных директорий Chromium..."
echo "==========================================="
echo ""

# Navigate to project directory
PROJECT_DIR="/var/www/html/nord-laundry-telegram-bot"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    echo "📁 Работаем в: $(pwd)"
else
    # If VPS path doesn't exist, use current directory
    echo "📁 Работаем в: $(pwd)"
fi

# Count existing directories
CHROMIUM_DIRS=$(find ./tmp -type d -name "chromium-*" 2>/dev/null | wc -l)
echo "📊 Найдено временных директорий Chromium: $CHROMIUM_DIRS"

if [ "$CHROMIUM_DIRS" -gt 0 ]; then
    # Show total size
    TOTAL_SIZE=$(du -sh ./tmp 2>/dev/null | awk '{print $1}')
    echo "💾 Общий размер ./tmp: $TOTAL_SIZE"
    
    # Remove old directories (older than 1 hour)
    echo ""
    echo "🗑️  Удаляем директории старше 1 часа..."
    find ./tmp -type d -name "chromium-*" -mmin +60 -exec rm -rf {} + 2>/dev/null
    
    # Count remaining
    REMAINING=$(find ./tmp -type d -name "chromium-*" 2>/dev/null | wc -l)
    echo "✅ Осталось активных директорий: $REMAINING"
    
    # Show new size
    NEW_SIZE=$(du -sh ./tmp 2>/dev/null | awk '{print $1}')
    echo "💾 Новый размер ./tmp: $NEW_SIZE"
else
    echo "✅ Временных директорий не найдено"
fi

echo ""
echo "==========================================="
echo "✅ Очистка завершена!"
