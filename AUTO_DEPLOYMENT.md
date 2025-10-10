# 🚀 Автоматическое развертывание через Git + PM2

## 📋 Ответ на ваш вопрос

**Сейчас:** Команды нужно выполнять вручную ❌  
**После настройки:** Автоматическое развертывание при `git push` ✅

## 🔧 Настройка автоматического развертывания

### 1. Настройка на локальной машине

```bash
# Запустите мастер настройки
npm run setup-auto-deploy
```

Скрипт запросит:
- IP адрес VPS
- Пользователя VPS
- URL Git репозитория
- Путь к проекту на VPS

### 2. Настройка на VPS

```bash
# Загрузите скрипт настройки на VPS
scp setup-vps.sh root@YOUR_VPS_IP:/root/
ssh root@YOUR_VPS_IP
chmod +x setup-vps.sh
./setup-vps.sh
```

## 🔄 Варианты автоматического развертывания

### Вариант 1: PM2 Deploy (рекомендуется)

```bash
# На локальной машине
pm2 deploy ecosystem.config.cjs production setup
pm2 deploy ecosystem.config.cjs production
```

**После этого:** При каждом `git push` выполняйте:
```bash
pm2 deploy ecosystem.config.cjs production
```

### Вариант 2: Git Webhook (полностью автоматический)

1. **Настройте webhook в GitHub/GitLab:**
   - URL: `http://YOUR_VPS_IP:3001/webhook`
   - События: Push events
   - Секретный ключ: `your-secret-key`

2. **Запустите webhook сервер на VPS:**
   ```bash
   pm2 start ecosystem.config.cjs
   ```

**После этого:** При каждом `git push` в main ветку будет **автоматическое** развертывание!

### Вариант 3: Ручное развертывание

```bash
# На VPS
cd /var/www/html/nord-laundry-telegram-bot
git pull origin main
npm install --production
npm run build
pm2 restart nord-laundry-bot
```

## 📊 Что происходит при автоматическом развертывании

1. **Остановка бота** (сохранение авторизации)
2. **Получение обновлений** из Git
3. **Установка зависимостей** (`npm install`)
4. **Компиляция TypeScript** (`npm run build`)
5. **Восстановление авторизации** WhatsApp
6. **Запуск бота** через PM2
7. **Сохранение конфигурации** PM2

## 🔐 Автоматическое сохранение авторизации

При каждом развертывании:
- ✅ Авторизация WhatsApp **автоматически сохраняется**
- ✅ Создается резервная копия
- ✅ Авторизация **автоматически восстанавливается**
- ✅ **Никаких повторных QR кодов!**

## 🚀 Команды для управления

### Локально:
```bash
npm run setup-auto-deploy    # Настройка автоматического развертывания
npm run backup-auth          # Создать архив авторизации
pm2 deploy ecosystem.config.cjs production  # Развертывание
```

### На VPS:
```bash
pm2 status                   # Статус процессов
pm2 logs nord-laundry-bot    # Логи бота
pm2 logs webhook-server      # Логи webhook сервера
pm2 monit                    # Мониторинг в реальном времени
pm2 restart nord-laundry-bot # Перезапуск бота
```

## 📱 Настройка webhook в GitHub

1. Перейдите в Settings → Webhooks
2. Нажмите "Add webhook"
3. Заполните:
   - **Payload URL:** `http://YOUR_VPS_IP:3001/webhook`
   - **Content type:** `application/json`
   - **Secret:** `your-secret-key`
   - **Events:** Just the push event
4. Нажмите "Add webhook"

## 🔍 Проверка работы

### После настройки webhook:

1. **Сделайте изменения в коде**
2. **Выполните git push:**
   ```bash
   git add .
   git commit -m "Test auto deployment"
   git push origin main
   ```
3. **Проверьте логи на VPS:**
   ```bash
   pm2 logs webhook-server
   pm2 logs nord-laundry-bot
   ```

### Ожидаемый результат:
```
🔄 Получен webhook для развертывания...
📝 Commit: Test auto deployment
👤 Author: Your Name
🚀 Запуск автоматического развертывания...
✅ Развертывание завершено
```

## 🆘 Устранение неполадок

### Webhook не срабатывает:
```bash
# Проверьте, что webhook сервер запущен
pm2 status

# Проверьте логи
pm2 logs webhook-server

# Проверьте доступность порта
netstat -tlnp | grep :3001
```

### Ошибки развертывания:
```bash
# Проверьте права доступа
ls -la /var/www/html/nord-laundry-telegram-bot/

# Проверьте Git репозиторий
cd /var/www/html/nord-laundry-telegram-bot/
git status
```

## 💡 Преимущества автоматического развертывания

- ✅ **Один раз настроил** - работает всегда
- ✅ **Автоматическое сохранение** авторизации WhatsApp
- ✅ **Быстрое развертывание** (30-60 секунд)
- ✅ **Откат к предыдущей версии** через PM2
- ✅ **Мониторинг** в реальном времени
- ✅ **Логирование** всех операций

## 🎯 Итог

**До настройки:** Ручное выполнение команд ❌  
**После настройки:** `git push` → автоматическое развертывание ✅

**Авторизация WhatsApp:** Сохраняется автоматически на 10 лет! 🔐
