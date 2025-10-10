#!/bin/bash

echo "🔄 Автоматическое развертывание через Git webhook..."

# Настройки
PROJECT_DIR="/var/www/html/nord-laundry-telegram-bot"
GIT_REPO="https://github.com/your-username/nord-laundry-bot.git"  # Замените на ваш репозиторий
BRANCH="main"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Переходим в папку проекта
cd "$PROJECT_DIR" || {
    error "Не удалось перейти в папку проекта: $PROJECT_DIR"
    exit 1
}

log "Начинаем автоматическое развертывание..."

# 1. Останавливаем PM2 процесс
log "Останавливаем PM2 процесс..."
pm2 stop nord-laundry-bot 2>/dev/null || warning "Процесс не был запущен"

# 2. Создаем резервную копию авторизации
if [ -d ".wwebjs_auth" ]; then
    log "Создаем резервную копию авторизации..."
    BACKUP_NAME="backup_auth_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$BACKUP_NAME" .wwebjs_auth/ 2>/dev/null
    if [ $? -eq 0 ]; then
        success "Резервная копия создана: $BACKUP_NAME"
    fi
fi

# 3. Получаем обновления из Git
log "Получаем обновления из Git..."
git fetch origin
git reset --hard origin/$BRANCH

if [ $? -ne 0 ]; then
    error "Ошибка при получении обновлений из Git"
    exit 1
fi

# 4. Устанавливаем зависимости
log "Устанавливаем зависимости..."
npm install --production

# 5. Компилируем TypeScript
log "Компилируем TypeScript..."
npm run build

# 6. Восстанавливаем авторизацию из резервной копии
if [ -f "$BACKUP_NAME" ]; then
    log "Восстанавливаем авторизацию..."
    tar -xzf "$BACKUP_NAME"
    success "Авторизация восстановлена"
fi

# 7. Запускаем через PM2
log "Запускаем бота через PM2..."
pm2 start ecosystem.config.cjs
pm2 save

success "Автоматическое развертывание завершено!"
log "Статус: $(pm2 status | grep nord-laundry-bot)"
