#!/bin/bash

# Скрипт для установки системы автоматического восстановления WhatsApp авторизации
# Работает как на локальной машине, так и на VPS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="whatsapp-auth-recovery"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CRON_FILE="/etc/cron.d/whatsapp-auth-check"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Функция проверки прав root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log "❌ Этот скрипт должен быть запущен с правами root"
        log "💡 Используйте: sudo $0"
        exit 1
    fi
}

# Функция установки systemd сервиса
install_systemd_service() {
    log "🔧 Устанавливаем systemd сервис..."
    
    # Копируем файл сервиса
    cp "${SCRIPT_DIR}/whatsapp-auth-recovery.service" "$SERVICE_FILE"
    
    # Устанавливаем правильные права
    chmod 644 "$SERVICE_FILE"
    
    # Перезагружаем systemd
    systemctl daemon-reload
    
    # Включаем сервис
    systemctl enable "$SERVICE_NAME"
    
    log "✅ Systemd сервис установлен и включен"
}

# Функция установки cron задачи
install_cron_job() {
    log "⏰ Устанавливаем cron задачу..."
    
    # Создаем cron задачу для проверки каждые 6 часов
    cat > "$CRON_FILE" << EOF
# WhatsApp Auth Recovery Check
# Проверка каждые 6 часов
0 */6 * * * root cd /opt/nord-laundry-bot && ./auto-auth-recovery.sh check >> /var/log/whatsapp-auth-check.log 2>&1
EOF
    
    # Устанавливаем правильные права
    chmod 644 "$CRON_FILE"
    
    log "✅ Cron задача установлена"
}

# Функция настройки логов
setup_logging() {
    log "📝 Настраиваем логирование..."
    
    # Создаем директорию для логов
    mkdir -p /var/log
    
    # Создаем файлы логов
    touch /var/log/whatsapp-auth-recovery.log
    touch /var/log/whatsapp-auth-check.log
    
    # Устанавливаем права
    chmod 644 /var/log/whatsapp-auth-*.log
    
    # Настраиваем logrotate
    cat > /etc/logrotate.d/whatsapp-auth << EOF
/var/log/whatsapp-auth-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload whatsapp-auth-recovery > /dev/null 2>&1 || true
    endscript
}
EOF
    
    log "✅ Логирование настроено"
}

# Функция настройки директорий
setup_directories() {
    log "📁 Настраиваем директории..."
    
    # Создаем директорию для бэкапов
    mkdir -p /opt/whatsapp-auth-backup
    
    # Устанавливаем права
    chmod 755 /opt/whatsapp-auth-backup
    
    # Создаем директорию для логов проекта
    mkdir -p /opt/nord-laundry-bot/logs
    
    # Устанавливаем права
    chmod 755 /opt/nord-laundry-bot/logs
    
    log "✅ Директории настроены"
}

# Функция настройки прав доступа
setup_permissions() {
    log "🔐 Настраиваем права доступа..."
    
    # Устанавливаем права на скрипты
    chmod +x /opt/nord-laundry-bot/auto-auth-recovery.sh
    chmod +x /opt/nord-laundry-bot/auto-restore-auth.sh
    
    # Устанавливаем права на директорию проекта
    chmod 755 /opt/nord-laundry-bot
    
    # Устанавливаем права на директорию авторизации
    if [ -d "/opt/nord-laundry-bot/.wwebjs_auth" ]; then
        chmod -R 755 /opt/nord-laundry-bot/.wwebjs_auth
    fi
    
    log "✅ Права доступа настроены"
}

# Функция запуска сервиса
start_service() {
    log "🚀 Запускаем сервис..."
    
    # Запускаем сервис
    systemctl start "$SERVICE_NAME"
    
    # Проверяем статус
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log "✅ Сервис успешно запущен"
    else
        log "❌ Ошибка запуска сервиса"
        systemctl status "$SERVICE_NAME" --no-pager
        exit 1
    fi
}

# Функция проверки установки
verify_installation() {
    log "🔍 Проверяем установку..."
    
    # Проверяем systemd сервис
    if systemctl is-enabled --quiet "$SERVICE_NAME"; then
        log "✅ Systemd сервис включен"
    else
        log "❌ Systemd сервис не включен"
        return 1
    fi
    
    # Проверяем cron задачу
    if [ -f "$CRON_FILE" ]; then
        log "✅ Cron задача установлена"
    else
        log "❌ Cron задача не установлена"
        return 1
    fi
    
    # Проверяем логи
    if [ -f "/var/log/whatsapp-auth-recovery.log" ]; then
        log "✅ Логи настроены"
    else
        log "❌ Логи не настроены"
        return 1
    fi
    
    log "✅ Установка проверена успешно"
    return 0
}

# Функция отображения статуса
show_status() {
    log "📊 Статус системы автоматического восстановления:"
    echo ""
    
    # Статус systemd сервиса
    echo "🔧 Systemd сервис:"
    systemctl status "$SERVICE_NAME" --no-pager -l
    echo ""
    
    # Статус cron задачи
    echo "⏰ Cron задача:"
    if [ -f "$CRON_FILE" ]; then
        cat "$CRON_FILE"
    else
        echo "❌ Cron задача не найдена"
    fi
    echo ""
    
    # Последние логи
    echo "📝 Последние логи:"
    if [ -f "/var/log/whatsapp-auth-recovery.log" ]; then
        tail -n 10 /var/log/whatsapp-auth-recovery.log
    else
        echo "❌ Логи не найдены"
    fi
    echo ""
}

# Функция удаления
uninstall() {
    log "🗑️ Удаляем систему автоматического восстановления..."
    
    # Останавливаем и отключаем сервис
    systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    systemctl disable "$SERVICE_NAME" 2>/dev/null || true
    
    # Удаляем файл сервиса
    rm -f "$SERVICE_FILE"
    
    # Удаляем cron задачу
    rm -f "$CRON_FILE"
    
    # Удаляем logrotate конфигурацию
    rm -f /etc/logrotate.d/whatsapp-auth
    
    # Перезагружаем systemd
    systemctl daemon-reload
    
    log "✅ Система автоматического восстановления удалена"
}

# Основная функция
main() {
    log "🚀 Установка системы автоматического восстановления WhatsApp авторизации"
    
    case "${1:-}" in
        "install")
            check_root
            setup_directories
            setup_permissions
            install_systemd_service
            install_cron_job
            setup_logging
            start_service
            verify_installation
            log "✅ Установка завершена успешно"
            show_status
            ;;
        "uninstall")
            check_root
            uninstall
            ;;
        "status")
            show_status
            ;;
        "restart")
            check_root
            systemctl restart "$SERVICE_NAME"
            log "✅ Сервис перезапущен"
            ;;
        "logs")
            if [ -f "/var/log/whatsapp-auth-recovery.log" ]; then
                tail -f /var/log/whatsapp-auth-recovery.log
            else
                log "❌ Логи не найдены"
            fi
            ;;
        "help"|"-h"|"--help")
            echo "Использование: $0 [команда]"
            echo ""
            echo "Команды:"
            echo "  install   - установить систему автоматического восстановления"
            echo "  uninstall - удалить систему автоматического восстановления"
            echo "  status    - показать статус системы"
            echo "  restart   - перезапустить сервис"
            echo "  logs      - показать логи в реальном времени"
            echo "  help      - показать эту справку"
            echo ""
            echo "Примеры:"
            echo "  sudo $0 install    # Установить систему"
            echo "  sudo $0 status     # Проверить статус"
            echo "  sudo $0 logs       # Посмотреть логи"
            ;;
        *)
            log "❌ Неизвестная команда: ${1:-}"
            log "💡 Используйте: $0 help"
            exit 1
            ;;
    esac
}

# Запускаем основную функцию
main "$@"
