# Исправление проблемы с созданием тредов

## Проблема
Сообщения из форм сайта попадали в общую группу Telegram вместо создания новых тредов.

## Причина
Отсутствовал API endpoint для приема заявок с сайта. Webhook-server обрабатывал только GitHub webhooks для развертывания.

## Решение

### 1. Добавлен API endpoint `/api/application`
- Принимает POST запросы с данными заявок
- Обрабатывает заявки через ApplicationBot
- Создает новые треды в Telegram группе

### 2. Настроен CORS
- Разрешены запросы с любых доменов
- Поддержка preflight запросов

### 3. Создана документация
- `API_DOCUMENTATION.md` - подробная документация API
- Примеры кода для JavaScript, jQuery, PHP
- Инструкции по тестированию

## Развертывание исправления

### 1. Обновить код на VPS
```bash
# На VPS
cd /path/to/nord-laundry-bot
git pull origin main
npm run build
pm2 restart webhook-server
```

### 2. Проверить работу
```bash
# Тест API
node test-api.js
```

### 3. Настроить сайт
Использовать endpoint: `http://your-vps-ip:3001/api/application`

Пример JavaScript:
```javascript
fetch('http://your-vps-ip:3001/api/application', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "Имя клиента",
    phone: "+7 (999) 123-45-67",
    source: "website_form",
    messageType: "text"
  })
});
```

## Проверка работы

1. Отправить тестовую заявку через API
2. Проверить, что в Telegram группе создался новый тред
3. Убедиться, что сообщение не попало в общий чат

## Логи

Все заявки с сайта логируются с префиксом:
```
📋 Получена заявка с сайта: {данные заявки}
```

## Безопасность

- API принимает запросы с любых доменов
- В продакшене рекомендуется добавить проверку домена
- Можно добавить API ключи для дополнительной безопасности
