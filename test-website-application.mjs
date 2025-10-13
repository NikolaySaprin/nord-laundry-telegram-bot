#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки обработки заявок с сайта
 * 
 * Использование:
 * node test-website-application.mjs
 */

import http from 'http';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001';

// Тестовые данные для разных форм
const testApplications = [
  {
    name: 'Тестовая заявка - Форма контакта',
    data: {
      source: 'contact_form',
      name: 'Иван Тестов',
      phone: '+79991234567',
      sphere: 'Гостиничный бизнес',
      messageType: 'text'
    }
  },
  {
    name: 'Тестовая заявка - Нижняя форма',
    data: {
      source: 'bottom_form',
      name: 'Мария Петрова',
      phone: '+79997654321',
      messageType: 'text'
    }
  },
  {
    name: 'Тестовая заявка - Услуги',
    data: {
      source: 'services_form',
      name: 'Алексей Сидоров',
      phone: '+79995554433',
      sphere: 'Ресторан',
      messageType: 'text'
    }
  },
  {
    name: 'Тестовая заявка - Модальное окно',
    data: {
      source: 'modal_form',
      name: 'Елена Смирнова',
      phone: '+79993332211',
      messageType: 'text'
    }
  },
  {
    name: 'Тестовая заявка - Общая форма',
    data: {
      source: 'website_form',
      name: 'Дмитрий Козлов',
      phone: '+79991112233',
      sphere: 'Медицина',
      messageType: 'text'
    }
  }
];

function sendApplication(application) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(application.data);
    
    const options = {
      hostname: new URL(WEBHOOK_URL).hostname,
      port: new URL(WEBHOOK_URL).port || 80,
      path: '/api/application',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve({ success: res.statusCode === 200, response, statusCode: res.statusCode });
        } catch (error) {
          resolve({ success: false, error: 'Invalid JSON response', statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Запуск тестов заявок с сайта...\n');
  console.log(`🌐 Webhook URL: ${WEBHOOK_URL}/api/application\n`);
  console.log('━'.repeat(60));
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testApplications.length; i++) {
    const test = testApplications[i];
    
    console.log(`\n📋 Тест ${i + 1}/${testApplications.length}: ${test.name}`);
    console.log(`   Источник: ${test.data.source}`);
    console.log(`   Имя: ${test.data.name}`);
    console.log(`   Телефон: ${test.data.phone}`);
    
    try {
      const result = await sendApplication(test);
      
      if (result.success) {
        console.log(`   ✅ Успешно отправлено (HTTP ${result.statusCode})`);
        console.log(`   📨 Ответ:`, result.response);
        successCount++;
      } else {
        console.log(`   ❌ Ошибка (HTTP ${result.statusCode})`);
        console.log(`   📨 Ответ:`, result.response || result.error);
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Ошибка подключения: ${error.message}`);
      failCount++;
    }
    
    // Задержка между запросами
    if (i < testApplications.length - 1) {
      console.log('   ⏳ Ожидание 2 секунды...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 Результаты тестирования:');
  console.log(`   ✅ Успешно: ${successCount}`);
  console.log(`   ❌ Ошибок: ${failCount}`);
  console.log(`   📈 Всего: ${testApplications.length}`);
  
  console.log('\n💡 Проверьте Telegram группу:');
  console.log('   - Должны быть созданы отдельные темы для каждой заявки');
  console.log('   - Названия тем должны соответствовать источникам');
  console.log('   - Время должно быть в формате "ДД.ММ.ГГГГ, ЧЧ:ММ:СС (МСК)"');
  
  if (failCount > 0) {
    console.log('\n⚠️  Обнаружены ошибки! Проверьте:');
    console.log('   1. Работает ли webhook-server: pm2 status');
    console.log('   2. Доступен ли порт 3001: netstat -tulpn | grep 3001');
    console.log('   3. Проверьте логи: pm2 logs nord-laundry-bot --lines 50');
  }
  
  console.log('\n');
}

// Запуск тестов
runTests().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
