# API Документация для интеграции с сайтом

## Endpoint для отправки заявок

**URL:** `POST /api/application`  
**Content-Type:** `application/json`

### Формат данных заявки

```json
{
  "name": "Имя клиента",
  "phone": "+7 (999) 123-45-67",
  "sphere": "Прачечная (опционально)",
  "source": "website_form",
  "userMessage": "Текст сообщения (опционально)",
  "messageType": "text"
}
```

### Поддерживаемые источники (source)

- `website_form` - общая форма сайта
- `contact_form` - форма контакта
- `bottom_form` - нижняя форма
- `services_form` - форма в разделе услуг
- `modal_form` - модальное окно

### Примеры запросов

#### JavaScript (fetch)
```javascript
const applicationData = {
  name: "Иван Петров",
  phone: "+7 (999) 123-45-67",
  sphere: "Прачечная",
  source: "website_form",
  userMessage: "Нужна стирка постельного белья",
  messageType: "text"
};

fetch('http://your-vps-ip:3001/api/application', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(applicationData)
})
.then(response => response.json())
.then(data => {
  console.log('Заявка отправлена:', data);
})
.catch(error => {
  console.error('Ошибка:', error);
});
```

#### jQuery
```javascript
$.ajax({
  url: 'http://your-vps-ip:3001/api/application',
  type: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({
    name: "Иван Петров",
    phone: "+7 (999) 123-45-67",
    sphere: "Прачечная",
    source: "website_form",
    userMessage: "Нужна стирка постельного белья",
    messageType: "text"
  }),
  success: function(data) {
    console.log('Заявка отправлена:', data);
  },
  error: function(xhr, status, error) {
    console.error('Ошибка:', error);
  }
});
```

#### PHP
```php
<?php
$applicationData = [
    'name' => 'Иван Петров',
    'phone' => '+7 (999) 123-45-67',
    'sphere' => 'Прачечная',
    'source' => 'website_form',
    'userMessage' => 'Нужна стирка постельного белья',
    'messageType' => 'text'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://your-vps-ip:3001/api/application');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($applicationData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

### Ответы API

#### Успешная обработка (200)
```json
{
  "status": "success",
  "message": "Application processed"
}
```

#### Ошибка валидации (400)
```json
{
  "status": "error",
  "message": "Invalid application data"
}
```

#### Ошибка сервера (500)
```json
{
  "status": "error",
  "message": "Bot not initialized"
}
```

### Настройка на VPS

1. Убедитесь, что webhook-server запущен на порту 3001
2. Замените `your-vps-ip` на реальный IP адрес вашего VPS
3. Убедитесь, что порт 3001 открыт в файрволе

### Проверка работы API

```bash
curl -X POST http://your-vps-ip:3001/api/application \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тест",
    "phone": "+7 (999) 123-45-67",
    "source": "website_form",
    "messageType": "text"
  }'
```

### Логирование

Все заявки логируются в консоль webhook-server с префиксом `📋 Получена заявка с сайта:`

### Безопасность

- API принимает запросы с любых доменов (CORS настроен)
- Рекомендуется добавить проверку домена в продакшене
- Можно добавить API ключи для дополнительной безопасности
