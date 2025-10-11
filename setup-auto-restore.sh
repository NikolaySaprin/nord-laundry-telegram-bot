#!/bin/bash

# Скрипт для настройки автоматического восстановления WhatsApp сессии на VPS

set -e

PROJECT_DIR="/opt/nord-laundry-bot"
SERVICE_FILE="whatsapp-auth-restore.service"
SCRIPT_FILE="auto-restore-auth.sh"
LOG_DIR="/var/log"
BACKUP_DIR="/opt/whatsapp-auth-backup"

echo "🚀 Настройка автоматического восстановления WhatsApp сессии на VPS..."

# Проверяем, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Этот скрипт должен быть запущен от root"
    echo "💡 Используйте: sudo $0"
    exit 1
fi

# Создаем необходимые директории
echo "📁 Создаем необходимые директории..."
mkdir -p "$PROJECT_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Копируем скрипт восстановления
echo "📋 Копируем скрипт автоматического восстановления..."
cp "$SCRIPT_FILE" "$PROJECT_DIR/"
chmod +x "$PROJECT_DIR/$SCRIPT_FILE"

# Копируем systemd сервис
echo "⚙️ Настраиваем systemd сервис..."
cp "$SERVICE_FILE" "/etc/systemd/system/"

# Перезагружаем systemd
echo "🔄 Перезагружаем systemd..."
systemctl daemon-reload

# Включаем сервис
echo "✅ Включаем сервис автоматического восстановления..."
systemctl enable whatsapp-auth-restore.service

# Создаем cron задачу для периодической проверки
echo "⏰ Настраиваем периодическую проверку сессии..."
cat > /etc/cron.d/whatsapp-auth-check << EOF
# Проверка WhatsApp сессии каждые 6 часов
0 */6 * * * root cd $PROJECT_DIR && ./auto-restore-auth.sh check >> $LOG_DIR/whatsapp-auth-check.log 2>&1
EOF

# Создаем скрипт для ручного восстановления
echo "🛠️ Создаем скрипт для ручного восстановления..."
cat > "$PROJECT_DIR/restore-auth-manual.sh" << 'EOF'
#!/bin/bash

echo "🔄 Ручное восстановление WhatsApp сессии..."

# Проверяем наличие архива
if [ -f "whatsapp_auth_latest.tar.gz" ]; then
    echo "📦 Найден архив: whatsapp_auth_latest.tar.gz"
    ./auto-restore-auth.sh force
elif [ -f "/opt/whatsapp-auth-backup/whatsapp_auth_latest.tar.gz" ]; then
    echo "📦 Найден архив в бэкапе"
    cp "/opt/whatsapp-auth-backup/whatsapp_auth_latest.tar.gz" .
    ./auto-restore-auth.sh force
else
    echo "❌ Архив авторизации не найден"
    echo "💡 Загрузите файл whatsapp_auth_latest.tar.gz в директорию $PWD"
    exit 1
fi
EOF

chmod +x "$PROJECT_DIR/restore-auth-manual.sh"

# Создаем скрипт для загрузки архива
echo "📤 Создаем скрипт для загрузки архива..."
cat > "$PROJECT_DIR/upload-auth-archive.sh" << 'EOF'
#!/bin/bash

echo "📤 Скрипт для загрузки архива авторизации на VPS"
echo ""
echo "Использование:"
echo "1. На локальной машине скопируйте файл whatsapp_auth_latest.tar.gz"
echo "2. Загрузите его на VPS в директорию $PWD"
echo "3. Запустите: ./restore-auth-manual.sh"
echo ""
echo "Или используйте scp:"
echo "scp whatsapp_auth_latest.tar.gz user@vps-ip:$PWD/"
echo ""

if [ -f "whatsapp_auth_latest.tar.gz" ]; then
    echo "✅ Архив уже присутствует: whatsapp_auth_latest.tar.gz"
    ls -lh whatsapp_auth_latest.tar.gz
else
    echo "❌ Архив не найден: whatsapp_auth_latest.tar.gz"
fi
EOF

chmod +x "$PROJECT_DIR/upload-auth-archive.sh"

# Создаем логирование
echo "📝 Настраиваем логирование..."
touch "$LOG_DIR/whatsapp-auth-restore.log"
touch "$LOG_DIR/whatsapp-auth-check.log"
chmod 644 "$LOG_DIR/whatsapp-auth-restore.log"
chmod 644 "$LOG_DIR/whatsapp-auth-check.log"

# Проверяем статус сервиса
echo "🔍 Проверяем статус сервиса..."
systemctl status whatsapp-auth-restore.service --no-pager || true

echo ""
echo "✅ Настройка автоматического восстановления завершена!"
echo ""
echo "📋 Что было настроено:"
echo "  • Systemd сервис для автоматического восстановления при старте"
echo "  • Cron задача для периодической проверки (каждые 6 часов)"
echo "  • Скрипты для ручного управления"
echo "  • Логирование в /var/log/"
echo ""
echo "🛠️ Полезные команды:"
echo "  • Проверить статус: systemctl status whatsapp-auth-restore"
echo "  • Ручное восстановление: cd $PROJECT_DIR && ./restore-auth-manual.sh"
echo "  • Проверить логи: tail -f $LOG_DIR/whatsapp-auth-restore.log"
echo "  • Загрузить архив: cd $PROJECT_DIR && ./upload-auth-archive.sh"
echo ""
echo "💡 Для работы сервиса загрузите архив whatsapp_auth_latest.tar.gz в $PROJECT_DIR"
