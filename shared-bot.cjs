// CommonJS версия общего экземпляра бота для использования в webhook-server.js
const { ApplicationBot } = require('./dist/lib/telegram-bot.js');

let sharedBotInstance = null;

// Функция для получения или создания экземпляра бота
function getSharedBot() {
    if (!sharedBotInstance) {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID;
        const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === 'true';
        
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_GROUP_CHAT_ID) {
            sharedBotInstance = new ApplicationBot(
                TELEGRAM_BOT_TOKEN,
                TELEGRAM_GROUP_CHAT_ID,
                ENABLE_WHATSAPP
            );
            console.log('✅ Общий экземпляр ApplicationBot создан (CommonJS)');
        } else {
            console.error('❌ Переменные окружения для Telegram бота не найдены');
        }
    }
    
    return sharedBotInstance;
}

// Функция для запуска бота
function startSharedBot() {
    const bot = getSharedBot();
    if (bot) {
        bot.start();
        console.log('✅ Общий бот запущен (CommonJS)');
    }
}

// Функция для остановки бота
function stopSharedBot() {
    if (sharedBotInstance) {
        sharedBotInstance.stop();
        console.log('✅ Общий бот остановлен (CommonJS)');
    }
}

// Функция для обработки заявки
async function handleApplication(applicationData) {
    const bot = getSharedBot();
    if (bot) {
        console.log('📋 Обрабатываем заявку через shared bot:', {
            source: applicationData.source,
            name: applicationData.name,
            phone: applicationData.phone
        });
        await bot.handleNewApplication(applicationData);
        return true;
    }
    console.error('❌ Бот не инициализирован');
    return false;
}

module.exports = {
    getSharedBot,
    startSharedBot,
    stopSharedBot,
    handleApplication
};
