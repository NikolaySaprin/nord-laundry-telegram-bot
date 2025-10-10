#!/bin/bash

echo "🚀 Загрузка архива авторизации на VPS..."

# Проверяем, что архив существует
ARCHIVE_FILE="whatsapp_auth_20251010_121550.tar.gz"
if [ ! -f "$ARCHIVE_FILE" ]; then
    echo "❌ Архив не найден: $ARCHIVE_FILE"
    echo "💡 Сначала создайте архив: npm run backup-auth"
    exit 1
fi

echo "📁 Найден архив: $ARCHIVE_FILE"
echo "📊 Размер: $(du -sh "$ARCHIVE_FILE" | awk '{print $1}')"

echo ""
echo "📋 Инструкции для загрузки на VPS:"
echo ""
echo "1. 📤 Загрузите архив на VPS (замените данные на свои):"
echo "   scp $ARCHIVE_FILE root@YOUR_VPS_IP:/var/www/html/nord-laundry-telegram-bot/"
echo ""
echo "2. 🔧 Или через SFTP:"
echo "   sftp root@YOUR_VPS_IP"
echo "   put $ARCHIVE_FILE /var/www/html/nord-laundry-telegram-bot/"
echo "   exit"
echo ""
echo "3. ✅ Проверьте загрузку на VPS:"
echo "   ssh root@YOUR_VPS_IP"
echo "   cd /var/www/html/nord-laundry-telegram-bot/"
echo "   ls -la $ARCHIVE_FILE"
echo ""
echo "4. 🔄 Распакуйте архив:"
echo "   tar -xzf $ARCHIVE_FILE"
echo ""
echo "5. 🚀 Запустите бота:"
echo "   npm start"
echo ""
echo "💡 Пример с реальными данными:"
echo "   scp $ARCHIVE_FILE root@192.168.1.100:/var/www/html/nord-laundry-telegram-bot/"
echo "   ssh root@192.168.1.100"
echo "   cd /var/www/html/nord-laundry-telegram-bot/"
echo "   tar -xzf $ARCHIVE_FILE"
echo "   npm start"
