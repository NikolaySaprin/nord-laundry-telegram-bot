# ⚡ Быстрый перенос авторизации на VPS

## 📍 Где найти папку авторизации локально

**Путь на вашем Mac:**
```
/Users/nikolajsnv/Desktop/projects/nord/nord-laundry-bot/.wwebjs_auth/
```

## 🚀 Быстрые команды

### 1. Создать архив (на локальной машине)
```bash
npm run backup-auth
```

### 2. Загрузить на VPS
```bash
scp whatsapp_auth_*.tar.gz user@your-vps-ip:/path/to/your/bot/
```

### 3. Восстановить на VPS
```bash
ssh user@your-vps-ip
cd /path/to/your/bot/
npm run restore-auth whatsapp_auth_*.tar.gz
npm start
```

## 📋 Пример с реальными данными

```bash
# 1. Создаем архив
npm run backup-auth
# Создан: whatsapp_auth_20251010_121550.tar.gz (26MB)

# 2. Загружаем на VPS
scp whatsapp_auth_20251010_121550.tar.gz root@192.168.1.100:/root/nord-laundry-bot/

# 3. Подключаемся к VPS
ssh root@192.168.1.100

# 4. Восстанавливаем авторизацию
cd /root/nord-laundry-bot/
npm run restore-auth whatsapp_auth_20251010_121550.tar.gz

# 5. Запускаем бота
npm start
```

## ✅ Проверка

После запуска на VPS должно появиться:
```
✅ WhatsApp клиент авторизован
🔒 Сессия настроена на 10 лет без перелогина
✅ WhatsApp бот готов к работе!
```

## 🆘 Если что-то пошло не так

```bash
# Очистить сессию и начать заново
npm run clear-session
npm start
# Отсканировать QR код
npm run backup-auth
```

