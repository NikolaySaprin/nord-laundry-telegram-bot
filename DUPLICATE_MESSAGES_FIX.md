# Исправление дублирования сообщений и проблем с заявками с сайта

## Выявленные проблемы

### 1. Дублирование сообщений WhatsApp
**Проблема:** При отправке сообщения в WhatsApp в Telegram приходили 3 сообщения:
- 2 пустых служебных сообщения (`e2e_notification`, `notification_template`)
- 1 сообщение с текстом

**Причина:** Отсутствовала фильтрация служебных сообщений WhatsApp

### 2. Заявки с сайта не создают треды
**Проблема:** Заявки с сайта попадали в общий чат вместо создания новых тредов

**Причина:** Webhook-server создавал отдельный экземпляр ApplicationBot, который не имел доступа к активным тредам основного бота

## Внесенные исправления

### 1. Фильтрация служебных сообщений WhatsApp

Добавлена фильтрация в `handleIncomingMessage`:

```typescript
// Игнорируем служебные сообщения WhatsApp
const serviceMessageTypes = [
  'e2e_notification',
  'notification_template', 
  'call_log',
  'system',
  'protocol',
  'presence',
  'read_receipt',
  'revoked',
  'ephemeral',
  'notification'
];

if (serviceMessageTypes.includes(message.type)) {
  console.log(`⏭️ Пропускаем служебное сообщение типа: ${message.type}`);
  return;
}

// Игнорируем пустые сообщения (кроме медиа)
if (!message.body && !message.hasMedia) {
  console.log('⏭️ Пропускаем пустое сообщение');
  return;
}
```

### 2. Общий экземпляр бота

Создан файл `shared-bot.js` для управления общим экземпляром ApplicationBot:

```javascript
// Общий экземпляр бота для использования в разных процессах
const { ApplicationBot } = require('./dist/lib/telegram-bot.js');

let sharedBotInstance = null;

function getSharedBot() {
    if (!sharedBotInstance) {
        // Создаем экземпляр только один раз
        sharedBotInstance = new ApplicationBot(
            TELEGRAM_BOT_TOKEN,
            TELEGRAM_GROUP_CHAT_ID,
            ENABLE_WHATSAPP
        );
    }
    return sharedBotInstance;
}

async function handleApplication(applicationData) {
    const bot = getSharedBot();
    if (bot) {
        await bot.handleNewApplication(applicationData);
        return true;
    }
    return false;
}
```

### 3. Обновлен webhook-server

Webhook-server теперь использует общий экземпляр бота:

```javascript
// Импортируем общий экземпляр бота
const { handleApplication } = require('./shared-bot.js');

// Обрабатываем заявку через общий экземпляр бота
const success = await handleApplication(applicationData);
```

### 4. Обновлен bot-runner.mjs

Основной процесс теперь использует общий экземпляр:

```javascript
import { startSharedBot, stopSharedBot } from './shared-bot.js';

// Запускаем бота
startSharedBot();
```

## Результаты исправлений

### До исправлений:
- ❌ 3 сообщения в Telegram при одном сообщении WhatsApp
- ❌ Заявки с сайта попадали в general
- ❌ Отдельные экземпляры бота без общей памяти

### После исправлений:
- ✅ 1 сообщение в Telegram при одном сообщении WhatsApp
- ✅ Заявки с сайта создают новые треды
- ✅ Общий экземпляр бота с общей памятью активных тредов

## Тестирование

### 1. Тест WhatsApp сообщений
```bash
# Отправить сообщение в WhatsApp
# Проверить, что в Telegram приходит только одно сообщение
```

### 2. Тест заявок с сайта
```bash
# Запустить тестовый скрипт
node test-website-api.js

# Проверить, что создается новый тред в Telegram
```

### 3. Проверка логов
```bash
# Проверить логи на предмет служебных сообщений
pm2 logs nord-laundry-bot | grep "Пропускаем служебное сообщение"

# Проверить обработку заявок с сайта
pm2 logs webhook-server | grep "Получена заявка с сайта"
```

## Развертывание

### 1. Обновить код на VPS
```bash
git pull origin main
npm run build
pm2 restart nord-laundry-bot
pm2 restart webhook-server
```

### 2. Проверить работу
```bash
# Тест заявок с сайта
node test-website-api.js

# Проверить логи
pm2 logs nord-laundry-bot --lines 20
pm2 logs webhook-server --lines 20
```

## Мониторинг

### Ключевые индикаторы:

1. **WhatsApp сообщения:**
   - В логах должны появляться сообщения "Пропускаем служебное сообщение"
   - В Telegram должно приходить только одно сообщение

2. **Заявки с сайта:**
   - В логах webhook-server: "Получена заявка с сайта"
   - В Telegram должны создаваться новые треды

3. **Общий экземпляр бота:**
   - В логах: "Общий экземпляр ApplicationBot создан"
   - Активные треды должны сохраняться между процессами

## Устранение неполадок

### Если все еще дублируются сообщения:
1. Проверьте, что обновлен код WhatsApp сервиса
2. Убедитесь, что перезапущен бот: `pm2 restart nord-laundry-bot`
3. Проверьте логи на предмет служебных сообщений

### Если заявки с сайта не создают треды:
1. Проверьте, что webhook-server использует общий экземпляр
2. Убедитесь, что оба процесса перезапущены
3. Проверьте логи webhook-server на ошибки

### Если возникают ошибки с общим экземпляром:
1. Проверьте, что файл `shared-bot.js` создан
2. Убедитесь, что код скомпилирован: `npm run build`
3. Проверьте права доступа к файлам
