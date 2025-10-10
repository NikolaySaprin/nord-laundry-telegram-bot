#!/bin/bash

echo "🚀 Автоматическая загрузка архива на VPS..."

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
echo "🔧 Введите данные вашего VPS:"
echo ""

# Запрашиваем данные VPS
read -p "IP адрес VPS: " VPS_IP
read -p "Пользователь (обычно root): " VPS_USER
read -p "Путь к папке бота на VPS (например /var/www/html/nord-laundry-telegram-bot): " VPS_PATH

# Устанавливаем значения по умолчанию
VPS_USER=${VPS_USER:-root}
VPS_PATH=${VPS_PATH:-/var/www/html/nord-laundry-telegram-bot}

echo ""
echo "📋 Данные для загрузки:"
echo "   VPS IP: $VPS_IP"
echo "   Пользователь: $VPS_USER"
echo "   Путь: $VPS_PATH"
echo ""

read -p "Продолжить загрузку? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Загрузка отменена"
    exit 1
fi

echo ""
echo "📤 Загружаем архив на VPS..."

# Загружаем архив
scp "$ARCHIVE_FILE" "$VPS_USER@$VPS_IP:$VPS_PATH/"

if [ $? -eq 0 ]; then
    echo "✅ Архив успешно загружен на VPS"
    echo ""
    echo "🔧 Теперь подключитесь к VPS и распакуйте архив:"
    echo "   ssh $VPS_USER@$VPS_IP"
    echo "   cd $VPS_PATH"
    echo "   tar -xzf $ARCHIVE_FILE"
    echo "   npm start"
    echo ""
    echo "💡 Или выполните команды одной строкой:"
    echo "   ssh $VPS_USER@$VPS_IP 'cd $VPS_PATH && tar -xzf $ARCHIVE_FILE && npm start'"
else
    echo "❌ Ошибка при загрузке архива"
    echo "💡 Проверьте:"
    echo "   - IP адрес VPS"
    echo "   - Доступность SSH"
    echo "   - Правильность пути"
    echo "   - Права доступа"
fi
