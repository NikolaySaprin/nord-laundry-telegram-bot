#!/bin/bash

echo "🔧 Настройка автоматического развертывания..."

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

echo "📋 Настройка автоматического развертывания через Git + PM2"
echo ""

# Запрашиваем данные
read -p "IP адрес VPS: " VPS_IP
read -p "Пользователь VPS (обычно root): " VPS_USER
read -p "URL Git репозитория: " GIT_REPO
read -p "Путь к проекту на VPS (например /var/www/html/nord-laundry-telegram-bot): " VPS_PATH

# Устанавливаем значения по умолчанию
VPS_USER=${VPS_USER:-root}
VPS_PATH=${VPS_PATH:-/var/www/html/nord-laundry-telegram-bot}

echo ""
echo "📋 Данные для настройки:"
echo "   VPS IP: $VPS_IP"
echo "   Пользователь: $VPS_USER"
echo "   Git репозиторий: $GIT_REPO"
echo "   Путь на VPS: $VPS_PATH"
echo ""

read -p "Продолжить настройку? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Настройка отменена"
    exit 1
fi

echo ""
log "Начинаем настройку..."

# 1. Обновляем ecosystem.config.cjs
log "Обновляем ecosystem.config.cjs..."
sed -i.bak "s/YOUR_VPS_IP/$VPS_IP/g" ecosystem.config.cjs
sed -i.bak "s|https://github.com/your-username/nord-laundry-bot.git|$GIT_REPO|g" ecosystem.config.cjs
sed -i.bak "s|/var/www/html/nord-laundry-telegram-bot|$VPS_PATH|g" ecosystem.config.cjs

# 2. Создаем скрипт для настройки на VPS
log "Создаем скрипт настройки для VPS..."
cat > setup-vps.sh << EOF
#!/bin/bash

echo "🔧 Настройка VPS для автоматического развертывания..."

# Устанавливаем PM2 глобально
npm install -g pm2

# Создаем папку проекта
mkdir -p $VPS_PATH
cd $VPS_PATH

# Клонируем репозиторий
git clone $GIT_REPO .

# Устанавливаем зависимости
npm install --production

# Компилируем TypeScript
npm run build

# Настраиваем PM2 startup
pm2 startup
pm2 save

echo "✅ VPS настроен для автоматического развертывания"
EOF

chmod +x setup-vps.sh

# 3. Создаем инструкции
log "Создаем инструкции по настройке..."
cat > DEPLOYMENT_INSTRUCTIONS.md << EOF
# 🚀 Инструкции по настройке автоматического развертывания

## 📋 Настройка VPS

### 1. Подключитесь к VPS
\`\`\`bash
ssh $VPS_USER@$VPS_IP
\`\`\`

### 2. Запустите скрипт настройки
\`\`\`bash
# Загрузите скрипт на VPS
scp setup-vps.sh $VPS_USER@$VPS_IP:/root/
ssh $VPS_USER@$VPS_IP
chmod +x setup-vps.sh
./setup-vps.sh
\`\`\`

### 3. Настройте SSH ключи (для автоматического развертывания)
\`\`\`bash
# На локальной машине
ssh-copy-id $VPS_USER@$VPS_IP
\`\`\`

## 🔄 Автоматическое развертывание

### Вариант 1: Через PM2 Deploy
\`\`\`bash
# На локальной машине
pm2 deploy ecosystem.config.cjs production setup
pm2 deploy ecosystem.config.cjs production
\`\`\`

### Вариант 2: Через Git Webhook
1. Настройте webhook в GitHub/GitLab
2. URL: http://$VPS_IP:3001/webhook
3. При push в main ветку будет автоматическое развертывание

### Вариант 3: Ручное развертывание
\`\`\`bash
# На VPS
cd $VPS_PATH
git pull origin main
npm install --production
npm run build
pm2 restart nord-laundry-bot
\`\`\`

## 📊 Управление

### Просмотр статуса
\`\`\`bash
pm2 status
pm2 monit
\`\`\`

### Просмотр логов
\`\`\`bash
pm2 logs nord-laundry-bot
\`\`\`

### Перезапуск
\`\`\`bash
pm2 restart nord-laundry-bot
\`\`\`

## 🔧 Настройка авторизации WhatsApp

### Перенос авторизации
1. Создайте архив: \`npm run backup-auth\`
2. Загрузите на VPS: \`scp whatsapp_auth_*.tar.gz $VPS_USER@$VPS_IP:$VPS_PATH/\`
3. На VPS: \`tar -xzf whatsapp_auth_*.tar.gz\`

### Автоматическое сохранение
При каждом развертывании авторизация автоматически сохраняется и восстанавливается.
EOF

success "Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите setup-vps.sh на VPS и запустите его"
echo "2. Настройте SSH ключи для автоматического развертывания"
echo "3. Используйте команды из DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "🚀 Для развертывания используйте:"
echo "   pm2 deploy ecosystem.config.cjs production"
