#!/usr/bin/env node

const http = require('http');

// Тестовые данные заявки с сайта
const testApplication = {
  name: "Тест Сайтович",
  phone: "+7 (999) 123-45-67",
  sphere: "Прачечная",
  source: "website_form",
  userMessage: "Тестовая заявка с сайта - проверка создания тредов",
  messageType: "text"
};

const postData = JSON.stringify(testApplication);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/application',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Тестируем API endpoint для заявок с сайта...');
console.log('📋 Отправляем тестовую заявку:', testApplication);

const req = http.request(options, (res) => {
  console.log(`📡 Статус ответа: ${res.statusCode}`);
  console.log(`📋 Заголовки ответа:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📤 Ответ сервера:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Тест прошел успешно! Заявка должна быть создана в Telegram группе в новом треде.');
    } else {
      console.log('❌ Тест не прошел. Проверьте логи сервера.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Ошибка запроса:', error.message);
  console.log('💡 Убедитесь, что webhook-server запущен на порту 3001');
});

req.write(postData);
req.end();
