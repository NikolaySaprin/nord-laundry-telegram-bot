# 🚀 Руководство по развертыванию бота на VPS

## 📍 Локальное расположение папки авторизации

**Полный путь на вашем Mac:**
```
/Users/nikolajsnv/Desktop/projects/nord/nord-laundry-bot/.wwebjs_auth/
```

**Структура папки:**
```
.wwebjs_auth/
└── session-nord-laundry-whatsapp/
    ├── Default/          # Основные данные сессии
    └── DevToolsActivePort
```

## 📦 Создание архива авторизации

### На локальной машине:

1. **Создайте архив:**
   ```bash
   npm run backup-auth
   ```
   
2. **Или вручную:**
   ```bash
   tar -czf whatsapp_auth_$(date +%Y%m%d_%H%M%S).tar.gz .wwebjs_auth/
   ```

3. **Архив будет создан в папке проекта:**
   ```
   /Users/nikolajsnv/Desktop/projects/nord/nord-laundry-bot/whatsapp_auth_YYYYMMDD_HHMMSS.tar.gz
   ```

## 🌐 Перенос на VPS сервер

### Вариант 1: Через SCP (рекомендуется)

1. **Загрузите архив на VPS:**
   ```bash
   scp whatsapp_auth_YYYYMMDD_HHMMSS.tar.gz user@your-vps-ip:/path/to/your/bot/
   ```

2. **Подключитесь к VPS:**
   ```bash
   ssh user@your-vps-ip
   ```

3. **Перейдите в папку бота:**
   ```bash
   cd /path/to/your/bot/
   ```

4. **Восстановите авторизацию:**
   ```bash
   npm run restore-auth whatsapp_auth_YYYYMMDD_HHMMSS.tar.gz
   ```

### Вариант 2: Через SFTP

1. **Подключитесь через SFTP:**
   ```bash
   sftp user@your-vps-ip
   ```

2. **Загрузите архив:**
   ```bash
   put whatsapp_auth_YYYYMMDD_HHMMSS.tar.gz /path/to/your/bot/
   ```

3. **Выйдите из SFTP:**
   ```bash
   exit
   ```

4. **На VPS восстановите авторизацию:**
   ```bash
   cd /path/to/your/bot/
   npm run restore-auth whatsapp_auth_YYYYMMDD_HHMMSS.tar.gz
   ```

## 🔧 Настройка на VPS

### 1. Установка зависимостей

```bash
# Убедитесь, что Node.js установлен (версия 18+)
node --version

# Установите зависимости
npm install

# Скомпилируйте TypeScript
npm run build
```

### 2. Настройка переменных окружения

Создайте файл `.env` на VPS:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_GROUP_ID=your_telegram_group_id

# WhatsApp (опционально)
WHATSAPP_ENABLED=true
```

### 3. Проверка прав доступа

```bash
# Установите правильные права на папку авторизации
chmod -R 755 .wwebjs_auth/
chown -R $USER:$USER .wwebjs_auth/
```

### 4. Запуск бота

```bash
# Запуск в обычном режиме
npm start

# Или запуск в фоне с PM2
npm install -g pm2
pm2 start bot-runner.mjs --name "nord-laundry-bot"
pm2 save
pm2 startup
```

## 🔍 Проверка работы

### 1. Проверка авторизации

```bash
npm run check-auth
```

### 2. Проверка состояния сессии

```bash
npm run check-session
```

### 3. Тестирование

```bash
npm run test-thanks
```

## 🛠️ Устранение неполадок

### Проблема: Бот не авторизуется

**Решение:**
```bash
# Очистите сессию
npm run clear-session

# Запустите бота заново
npm start

# Отсканируйте QR код
```

### Проблема: Ошибки прав доступа

**Решение:**
```bash
# Установите правильные права
sudo chown -R $USER:$USER .wwebjs_auth/
chmod -R 755 .wwebjs_auth/
```

### Проблема: Бот не запускается

**Решение:**
```bash
# Проверьте зависимости
npm install

# Проверьте TypeScript компиляцию
npm run build

# Проверьте .env файл
cat .env
```

## 📊 Мониторинг

### Логи PM2

```bash
# Просмотр логов
pm2 logs nord-laundry-bot

# Мониторинг в реальном времени
pm2 monit
```

### Проверка процессов

```bash
# Проверка запущенных процессов
ps aux | grep "node bot-runner"

# Проверка портов
netstat -tlnp | grep :3000
```

## 🔄 Обновление авторизации

Если нужно обновить авторизацию на VPS:

1. **На локальной машине:**
   ```bash
   npm run backup-auth
   ```

2. **Загрузите новый архив на VPS**

3. **На VPS:**
   ```bash
   npm run restore-auth whatsapp_auth_NEW_DATE.tar.gz
   ```

## 💡 Важные замечания

- **Размер архива:** ~26MB (сжатый)
- **Авторизация действует:** 10 лет
- **Безопасность:** Не передавайте архив по незащищенным каналам
- **Резервные копии:** Регулярно создавайте архивы авторизации
- **Права доступа:** Убедитесь, что папка `.wwebjs_auth` доступна для записи

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `npm run check-auth`
2. Очистите сессию: `npm run clear-session`
3. Пересоздайте авторизацию: `npm start`
4. Создайте новый архив: `npm run backup-auth`

