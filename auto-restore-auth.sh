#!/bin/bash

# Скрипт для автоматического восстановления WhatsApp сессии на VPS
# Запускается при старте системы или при необходимости

AUTH_DIR=".wwebjs_auth"
ARCHIVE_FILE="whatsapp_auth_latest.tar.gz"
BACKUP_DIR="/opt/whatsapp-auth-backup"
LOG_FILE="/var/log/whatsapp-auth-restore.log"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Функция проверки и восстановления сессии
restore_session() {
    log "🔍 Проверяем необходимость восстановления WhatsApp сессии..."
    
    # Проверяем, существует ли папка авторизации
    if [ -d "$AUTH_DIR" ]; then
        log "✅ Папка авторизации существует: $AUTH_DIR"
        
        # Проверяем, не пустая ли папка
        if [ "$(ls -A $AUTH_DIR 2>/dev/null)" ]; then
            log "✅ Папка авторизации не пустая, восстановление не требуется"
            return 0
        else
            log "⚠️ Папка авторизации пустая, требуется восстановление"
        fi
    else
        log "⚠️ Папка авторизации не найдена: $AUTH_DIR"
    fi
    
    # Ищем архив для восстановления
    local archive_path=""
    
    # Проверяем в текущей директории
    if [ -f "$ARCHIVE_FILE" ]; then
        archive_path="$ARCHIVE_FILE"
        log "📦 Найден архив в текущей директории: $ARCHIVE_FILE"
    # Проверяем в директории бэкапа
    elif [ -f "$BACKUP_DIR/$ARCHIVE_FILE" ]; then
        archive_path="$BACKUP_DIR/$ARCHIVE_FILE"
        log "📦 Найден архив в директории бэкапа: $BACKUP_DIR/$ARCHIVE_FILE"
    # Ищем любой архив авторизации
    else
        archive_path=$(find . -name "whatsapp_auth_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        if [ -n "$archive_path" ]; then
            log "📦 Найден архив авторизации: $archive_path"
        fi
    fi
    
    if [ -z "$archive_path" ] || [ ! -f "$archive_path" ]; then
        log "❌ Архив авторизации не найден. Создайте архив на локальной машине и загрузите на VPS"
        return 1
    fi
    
    # Создаем директорию авторизации, если не существует
    mkdir -p "$AUTH_DIR"
    
    # Восстанавливаем из архива
    log "🔄 Восстанавливаем сессию из архива: $archive_path"
    
    if tar -xzf "$archive_path" -C .; then
        log "✅ Сессия успешно восстановлена из архива"
        
        # Устанавливаем правильные права доступа
        chmod -R 755 "$AUTH_DIR"
        chown -R $(whoami):$(whoami) "$AUTH_DIR" 2>/dev/null || true
        
        # Создаем бэкап в системной директории
        mkdir -p "$BACKUP_DIR"
        cp "$archive_path" "$BACKUP_DIR/" 2>/dev/null || true
        
        log "✅ Бэкап архива сохранен в: $BACKUP_DIR"
        return 0
    else
        log "❌ Ошибка при восстановлении сессии из архива"
        return 1
    fi
}

# Функция проверки целостности сессии
check_session_integrity() {
    log "🔍 Проверяем целостность WhatsApp сессии..."
    
    if [ ! -d "$AUTH_DIR" ]; then
        log "❌ Папка авторизации не найдена"
        return 1
    fi
    
    # Проверяем наличие ключевых файлов сессии
    local required_files=("session-*" "LocalStorage" "IndexedDB")
    local missing_files=()
    
    for pattern in "${required_files[@]}"; do
        if ! ls "$AUTH_DIR"/$pattern >/dev/null 2>&1; then
            missing_files+=("$pattern")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        log "✅ Целостность сессии в порядке"
        return 0
    else
        log "⚠️ Обнаружены отсутствующие файлы сессии: ${missing_files[*]}"
        return 1
    fi
}

# Основная функция
main() {
    log "🚀 Запуск автоматического восстановления WhatsApp сессии"
    
    # Проверяем целостность существующей сессии
    if check_session_integrity; then
        log "✅ Существующая сессия в порядке, восстановление не требуется"
        exit 0
    fi
    
    # Восстанавливаем сессию
    if restore_session; then
        log "✅ Автоматическое восстановление сессии завершено успешно"
        exit 0
    else
        log "❌ Не удалось восстановить сессию автоматически"
        log "💡 Требуется ручное вмешательство:"
        log "   1. Создайте архив на локальной машине"
        log "   2. Загрузите его на VPS"
        log "   3. Запустите: tar -xzf whatsapp_auth_latest.tar.gz"
        exit 1
    fi
}

# Обработка аргументов командной строки
case "${1:-}" in
    "force")
        log "🔄 Принудительное восстановление сессии"
        restore_session
        ;;
    "check")
        check_session_integrity
        ;;
    "help"|"-h"|"--help")
        echo "Использование: $0 [команда]"
        echo ""
        echo "Команды:"
        echo "  (без аргументов) - автоматическая проверка и восстановление"
        echo "  force            - принудительное восстановление"
        echo "  check            - только проверка целостности"
        echo "  help             - показать эту справку"
        ;;
    *)
        main
        ;;
esac
