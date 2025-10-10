#!/bin/bash

echo "🚀 Автоматическое развертывание бота на VPS..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверяем, что мы в правильной папке
if [ ! -f "package.json" ] || [ ! -f "ecosystem.config.cjs" ]; then
    error "Не найден package.json или ecosystem.config.cjs"
    error "Запустите скрипт из корня проекта"
    exit 1
fi

log "Начинаем развертывание..."

# 1. Останавливаем PM2 процесс
log "Останавливаем PM2 процесс..."
pm2 stop nord-laundry-bot 2>/dev/null || warning "Процесс не был запущен"

# 2. Создаем резервную копию текущей авторизации (если есть)
if [ -d ".wwebjs_auth" ]; then
    log "Создаем резервную копию текущей авторизации..."
    BACKUP_NAME="backup_auth_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$BACKUP_NAME" .wwebjs_auth/ 2>/dev/null
    if [ $? -eq 0 ]; then
        success "Резервная копия создана: $BACKUP_NAME"
    else
        warning "Не удалось создать резервную копию"
    fi
fi

# 3. Устанавливаем зависимости
log "Устанавливаем зависимости..."
npm install --production

if [ $? -ne 0 ]; then
    error "Ошибка при установке зависимостей"
    exit 1
fi

# 4. Компилируем TypeScript
log "Компилируем TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    error "Ошибка при компиляции TypeScript"
    exit 1
fi

# 5. Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    error "Файл .env не найден!"
    error "Создайте файл .env с необходимыми переменными"
    exit 1
fi

# 6. Проверяем наличие авторизации WhatsApp
if [ ! -d ".wwebjs_auth" ]; then
    warning "Папка авторизации WhatsApp не найдена"
    warning "Бот будет запрашивать новую авторизацию при запуске"
    
    # Ищем архивы авторизации
    AUTH_ARCHIVES=$(ls whatsapp_auth_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$AUTH_ARCHIVES" ]; then
        log "Найден архив авторизации: $AUTH_ARCHIVES"
        read -p "Восстановить авторизацию из архива? (y/n): " RESTORE_AUTH
        
        if [ "$RESTORE_AUTH" = "y" ] || [ "$RESTORE_AUTH" = "Y" ]; then
            log "Восстанавливаем авторизацию..."
            tar -xzf "$AUTH_ARCHIVES"
            if [ $? -eq 0 ]; then
                success "Авторизация восстановлена"
            else
                error "Ошибка при восстановлении авторизации"
            fi
        fi
    fi
fi

# 7. Создаем папку для логов
log "Создаем папку для логов..."
mkdir -p logs

# 8. Запускаем через PM2
log "Запускаем бота через PM2..."
pm2 start ecosystem.config.cjs

if [ $? -eq 0 ]; then
    success "Бот успешно запущен через PM2"
    
    # Показываем статус
    log "Статус процессов:"
    pm2 status
    
    # Сохраняем конфигурацию PM2
    pm2 save
    
    log "Конфигурация PM2 сохранена"
    
    # Показываем логи
    log "Последние логи:"
    pm2 logs nord-laundry-bot --lines 10
    
else
    error "Ошибка при запуске бота"
    exit 1
fi

success "Развертывание завершено!"
log "Для мониторинга используйте: pm2 monit"
log "Для просмотра логов: pm2 logs nord-laundry-bot"
log "Для перезапуска: pm2 restart nord-laundry-bot"
