#!/bin/bash

# Скрипт для автоматического восстановления WhatsApp авторизации
# Работает как локально, так и на VPS
# Автоматически восстанавливает сессию при её истечении

AUTH_DIR=".wwebjs_auth"
ARCHIVE_FILE="whatsapp_auth_latest.tar.gz"
BACKUP_DIR="/opt/whatsapp-auth-backup"
LOG_FILE="./logs/auth-recovery.log"

# Создаем директорию для логов, если не существует
mkdir -p logs

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
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

# Функция проверки актуальности сессии
check_session_freshness() {
    log "🔍 Проверяем актуальность WhatsApp сессии..."
    
    if [ ! -d "$AUTH_DIR" ]; then
        log "❌ Папка авторизации не найдена"
        return 1
    fi
    
    # Проверяем время последнего изменения файлов сессии
    local last_modified=$(find "$AUTH_DIR" -type f -name "session-*" -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1)
    
    if [ -z "$last_modified" ]; then
        log "❌ Не найдены файлы сессии"
        return 1
    fi
    
    local current_time=$(date +%s)
    local age_days=$(( (current_time - last_modified) / 86400 ))
    
    log "📅 Возраст сессии: $age_days дней"
    
    # Если сессия старше 30 дней, считаем её устаревшей
    if [ $age_days -gt 30 ]; then
        log "⚠️ Сессия устарела (старше 30 дней), требуется обновление"
        return 1
    fi
    
    log "✅ Сессия актуальна"
    return 0
}

# Функция восстановления сессии
restore_session() {
    log "🔄 Восстанавливаем WhatsApp сессию..."
    
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
        archive_path=$(find . -name "whatsapp_auth_*.tar.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        if [ -n "$archive_path" ]; then
            log "📦 Найден архив авторизации: $archive_path"
        fi
    fi
    
    if [ -z "$archive_path" ] || [ ! -f "$archive_path" ]; then
        log "❌ Архив авторизации не найден"
        return 1
    fi
    
    # Создаем резервную копию существующей сессии
    if [ -d "$AUTH_DIR" ]; then
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        log "💾 Создаем резервную копию существующей сессии: $backup_name"
        cp -r "$AUTH_DIR" "${AUTH_DIR}_${backup_name}" 2>/dev/null || true
    fi
    
    # Удаляем старую папку авторизации
    rm -rf "$AUTH_DIR"
    
    # Создаем новую директорию авторизации
    mkdir -p "$AUTH_DIR"
    
    # Восстанавливаем из архива
    log "🔄 Восстанавливаем сессию из архива: $archive_path"
    
    if tar -xzf "$archive_path" -C .; then
        log "✅ Сессия успешно восстановлена из архива"
        
        # Устанавливаем правильные права доступа
        chmod -R 755 "$AUTH_DIR"
        chown -R $(whoami):$(whoami) "$AUTH_DIR" 2>/dev/null || true
        
        # Создаем бэкап в системной директории (если на VPS)
        if [ -d "/opt" ]; then
            mkdir -p "$BACKUP_DIR"
            cp "$archive_path" "$BACKUP_DIR/" 2>/dev/null || true
            log "✅ Бэкап архива сохранен в: $BACKUP_DIR"
        fi
        
        return 0
    else
        log "❌ Ошибка при восстановлении сессии из архива"
        return 1
    fi
}

# Функция создания архива сессии
create_session_archive() {
    log "📦 Создаем архив текущей сессии..."
    
    if [ ! -d "$AUTH_DIR" ]; then
        log "❌ Папка авторизации не найдена"
        return 1
    fi
    
    # Удаляем старый архив, если существует
    if [ -f "$ARCHIVE_FILE" ]; then
        rm -f "$ARCHIVE_FILE"
        log "🗑️ Удален старый архив авторизации"
    fi
    
    # Создаем новый архив
    if tar -czf "$ARCHIVE_FILE" "$AUTH_DIR/"; then
        log "✅ Архив сессии создан: $ARCHIVE_FILE"
        
        # Создаем бэкап в системной директории (если на VPS)
        if [ -d "/opt" ]; then
            mkdir -p "$BACKUP_DIR"
            cp "$ARCHIVE_FILE" "$BACKUP_DIR/" 2>/dev/null || true
            log "✅ Бэкап архива сохранен в: $BACKUP_DIR"
        fi
        
        return 0
    else
        log "❌ Ошибка при создании архива сессии"
        return 1
    fi
}

# Функция мониторинга сессии
monitor_session() {
    log "👁️ Запускаем мониторинг сессии..."
    
    while true; do
        # Проверяем целостность сессии
        if ! check_session_integrity; then
            log "⚠️ Обнаружена проблема с целостностью сессии, пытаемся восстановить..."
            if restore_session; then
                log "✅ Сессия восстановлена"
            else
                log "❌ Не удалось восстановить сессию"
            fi
        fi
        
        # Проверяем актуальность сессии
        if ! check_session_freshness; then
            log "⚠️ Сессия устарела, создаем новый архив..."
            create_session_archive
        fi
        
        # Ждем 5 минут перед следующей проверкой
        sleep 300
    done
}

# Основная функция
main() {
    log "🚀 Запуск автоматического восстановления WhatsApp авторизации"
    
    case "${1:-}" in
        "check")
            log "🔍 Проверка состояния сессии"
            if check_session_integrity && check_session_freshness; then
                log "✅ Сессия в порядке"
                exit 0
            else
                log "❌ Сессия требует внимания"
                exit 1
            fi
            ;;
        "restore")
            log "🔄 Принудительное восстановление сессии"
            if restore_session; then
                log "✅ Сессия восстановлена"
                exit 0
            else
                log "❌ Не удалось восстановить сессию"
                exit 1
            fi
            ;;
        "archive")
            log "📦 Создание архива сессии"
            if create_session_archive; then
                log "✅ Архив создан"
                exit 0
            else
                log "❌ Не удалось создать архив"
                exit 1
            fi
            ;;
        "monitor")
            log "👁️ Запуск мониторинга сессии"
            monitor_session
            ;;
        "help"|"-h"|"--help")
            echo "Использование: $0 [команда]"
            echo ""
            echo "Команды:"
            echo "  (без аргументов) - автоматическая проверка и восстановление"
            echo "  check            - только проверка состояния сессии"
            echo "  restore          - принудительное восстановление"
            echo "  archive          - создание архива текущей сессии"
            echo "  monitor          - запуск мониторинга сессии"
            echo "  help             - показать эту справку"
            ;;
        *)
            # Автоматическая проверка и восстановление
            if check_session_integrity && check_session_freshness; then
                log "✅ Сессия в порядке, восстановление не требуется"
                exit 0
            else
                log "⚠️ Обнаружены проблемы с сессией, пытаемся восстановить..."
                if restore_session; then
                    log "✅ Сессия восстановлена"
                    exit 0
                else
                    log "❌ Не удалось восстановить сессию автоматически"
                    log "💡 Требуется ручное вмешательство:"
                    log "   1. Создайте архив на локальной машине"
                    log "   2. Загрузите его на VPS"
                    log "   3. Запустите: $0 restore"
                    exit 1
                fi
            fi
            ;;
    esac
}

# Запускаем основную функцию
main "$@"
