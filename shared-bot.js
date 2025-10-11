// Общий экземпляр бота для использования в разных процессах
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
            console.log('✅ Общий экземпляр ApplicationBot создан');
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
        console.log('✅ Общий бот запущен');
    }
}

// Функция для остановки бота
function stopSharedBot() {
    if (sharedBotInstance) {
        sharedBotInstance.stop();
        console.log('✅ Общий бот остановлен');
    }
}

// Функция для обработки заявки
async function handleApplication(applicationData) {
    const bot = getSharedBot();
    if (bot) {
        await bot.handleNewApplication(applicationData);
        return true;
    }
    return false;
}

module.exports = {
    getSharedBot,
    startSharedBot,
    stopSharedBot,
    handleApplication
};
