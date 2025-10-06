# Настройка Git репозитория для бота

## Инициализация репозитория

1. Инициализируйте Git репозиторий:
```bash
cd /Users/nikolajsnv/Desktop/projects/nord/nord-laundry-bot
git init
```

2. Добавьте все файлы:
```bash
git add .
```

3. Сделайте первый коммит:
```bash
git commit -m "Initial commit: Telegram bot for Nord Laundry"
```

4. Создайте репозиторий на GitHub (или другом Git хостинге)

5. Добавьте remote origin:
```bash
git remote add origin <repository-url>
```

6. Отправьте код:
```bash
git push -u origin main
```

## Настройка Git Secrets

Для безопасного хранения переменных окружения используйте Git Secrets:

1. Установите git-secrets:
```bash
# macOS
brew install git-secrets

# Ubuntu/Debian
sudo apt-get install git-secrets
```

2. Настройте git-secrets для репозитория:
```bash
cd /Users/nikolajsnv/Desktop/projects/nord/nord-laundry-bot
git secrets --install
git secrets --register-aws
```

3. Добавьте паттерны для защиты секретов:
```bash
git secrets --add 'TELEGRAM_BOT_TOKEN'
git secrets --add 'TELEGRAM_GROUP_CHAT_ID'
git secrets --add '.*\.env.*'
```

4. Создайте файл .env.example:
```bash
echo "TELEGRAM_BOT_TOKEN=your_bot_token_here" > .env.example
echo "TELEGRAM_GROUP_CHAT_ID=your_group_chat_id_here" >> .env.example
```

5. Добавьте .env.example в репозиторий:
```bash
git add .env.example
git commit -m "Add .env.example template"
```

## Настройка CI/CD (опционально)

Создайте файл `.github/workflows/deploy.yml` для автоматического развертывания:

```yaml
name: Deploy Bot

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/html/nord-laundry-bot
          git pull origin main
          npm install
          npm run build
          pm2 restart nord-laundry-bot
```

## Команды для работы с репозиторием

```bash
# Проверка статуса
git status

# Добавление изменений
git add .

# Коммит
git commit -m "Описание изменений"

# Отправка на сервер
git push origin main

# Получение изменений
git pull origin main

# Создание новой ветки
git checkout -b feature/new-feature

# Переключение на ветку
git checkout main

# Слияние ветки
git merge feature/new-feature
```
