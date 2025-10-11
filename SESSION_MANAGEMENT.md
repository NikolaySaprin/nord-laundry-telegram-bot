# Управление WhatsApp сессиями

## Обзор системы

Новая система управления сессиями решает две основные проблемы:
1. **Перезапись архивов** - вместо создания новых файлов каждый раз, обновляется один файл
2. **Автоматическое восстановление на VPS** - система сама восстанавливает сессию при необходимости

## Архитектура

### Локальная машина
- **Архив**: `whatsapp_auth_latest.tar.gz` (перезаписывается)
- **Создание**: Автоматически каждые 2 минуты при работе бота
- **Очистка**: Старые архивы с временными метками удаляются

### VPS сервер
- **Автоматическое восстановление**: Systemd сервис + cron
- **Проверка целостности**: Каждые 6 часов
- **Ручное управление**: Скрипты для загрузки и восстановления

## Файлы системы

### Основные скрипты
- `auto-restore-auth.sh` - Автоматическое восстановление сессии
- `setup-auto-restore.sh` - Установка системы на VPS
- `cleanup-old-archives.sh` - Очистка старых архивов
- `restore-auth-manual.sh` - Ручное восстановление (создается на VPS)
- `upload-auth-archive.sh` - Помощник для загрузки архива (создается на VPS)

### Конфигурация
- `whatsapp-auth-restore.service` - Systemd сервис
- `ecosystem.config.cjs` - Обновлен с проверкой сессии

## Установка на VPS

### 1. Автоматическая установка
```bash
# На VPS
sudo ./setup-auto-restore.sh
```

### 2. Ручная установка
```bash
# Копируем файлы
sudo cp auto-restore-auth.sh /opt/nord-laundry-bot/
sudo cp whatsapp-auth-restore.service /etc/systemd/system/

# Настраиваем systemd
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-auth-restore.service

# Создаем cron задачу
echo "0 */6 * * * root cd /opt/nord-laundry-bot && ./auto-restore-auth.sh check" | sudo tee /etc/cron.d/whatsapp-auth-check
```

## Использование

### Локальная машина

#### Создание архива
Архив создается автоматически, но можно принудительно:
```bash
# В коде WhatsApp сервиса вызывается createAuthArchive()
# Создается/обновляется whatsapp_auth_latest.tar.gz
```

#### Очистка старых архивов
```bash
./cleanup-old-archives.sh
```

### VPS сервер

#### Проверка статуса
```bash
# Проверить статус сервиса
sudo systemctl status whatsapp-auth-restore

# Проверить целостность сессии
cd /opt/nord-laundry-bot
./auto-restore-auth.sh check
```

#### Ручное восстановление
```bash
cd /opt/nord-laundry-bot

# Загрузить архив (если нужно)
./upload-auth-archive.sh

# Восстановить сессию
./restore-auth-manual.sh
```

#### Принудительное восстановление
```bash
cd /opt/nord-laundry-bot
./auto-restore-auth.sh force
```

## Логирование

### Локальная машина
- Логи бота: `./logs/combined.log`
- Сообщения о создании архива в логах бота

### VPS сервер
- Восстановление: `/var/log/whatsapp-auth-restore.log`
- Проверки: `/var/log/whatsapp-auth-check.log`
- Systemd: `journalctl -u whatsapp-auth-restore`

## Мониторинг

### Ключевые индикаторы

#### Локальная машина
```bash
# Проверить наличие архива
ls -lh whatsapp_auth_latest.tar.gz

# Проверить логи создания архива
tail -f logs/combined.log | grep "Архив авторизации"
```

#### VPS сервер
```bash
# Проверить статус сервиса
sudo systemctl status whatsapp-auth-restore

# Проверить логи восстановления
tail -f /var/log/whatsapp-auth-restore.log

# Проверить целостность сессии
cd /opt/nord-laundry-bot && ./auto-restore-auth.sh check
```

## Устранение неполадок

### Проблема: Архив не создается
**Решение:**
1. Проверить права доступа к директории
2. Проверить наличие папки `.wwebjs_auth`
3. Проверить логи бота на ошибки

### Проблема: Сессия не восстанавливается на VPS
**Решение:**
1. Проверить наличие архива: `ls -la whatsapp_auth_latest.tar.gz`
2. Проверить права доступа: `ls -la .wwebjs_auth/`
3. Запустить ручное восстановление: `./restore-auth-manual.sh`

### Проблема: Systemd сервис не работает
**Решение:**
1. Проверить статус: `sudo systemctl status whatsapp-auth-restore`
2. Проверить логи: `journalctl -u whatsapp-auth-restore`
3. Перезапустить: `sudo systemctl restart whatsapp-auth-restore`

### Проблема: Cron не работает
**Решение:**
1. Проверить cron задачу: `sudo crontab -l`
2. Проверить логи cron: `sudo tail -f /var/log/cron`
3. Проверить права на скрипт: `ls -la auto-restore-auth.sh`

## Безопасность

### Права доступа
- Архив: `644` (чтение для всех)
- Скрипты: `755` (выполнение для всех)
- Папка сессии: `755` (доступ для владельца)

### Резервное копирование
- Архив копируется в `/opt/whatsapp-auth-backup/`
- Автоматическое создание бэкапа при восстановлении

## Обновление системы

### При обновлении кода
```bash
# На VPS
git pull origin main
npm run build
sudo systemctl restart nord-laundry-bot
```

### При изменении конфигурации
```bash
# Обновить systemd сервис
sudo cp whatsapp-auth-restore.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart whatsapp-auth-restore
```

## Производительность

### Оптимизации
- Архив создается только при изменении сессии
- Проверка целостности каждые 6 часов (не постоянно)
- Автоматическая очистка старых архивов

### Мониторинг ресурсов
```bash
# Размер архива
ls -lh whatsapp_auth_latest.tar.gz

# Размер папки сессии
du -sh .wwebjs_auth/

# Использование диска
df -h
```

## Резервное копирование

### Автоматическое
- Архив копируется в системную директорию при восстановлении
- Сохраняется последняя рабочая версия

### Ручное
```bash
# Создать резервную копию
cp whatsapp_auth_latest.tar.gz backup_$(date +%Y%m%d_%H%M%S).tar.gz

# Восстановить из резервной копии
cp backup_20250101_120000.tar.gz whatsapp_auth_latest.tar.gz
./auto-restore-auth.sh force
```
