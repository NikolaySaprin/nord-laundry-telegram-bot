
import { ApplicationBot } from './dist/lib/telegram-bot.js';

let sharedBotInstance = null;


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


export function startSharedBot() {
    const bot = getSharedBot();
    if (bot) {
        bot.start();
        console.log('✅ Общий бот запущен');
    }
}


export function stopSharedBot() {
    if (sharedBotInstance) {
        sharedBotInstance.stop();
        console.log('✅ Общий бот остановлен');
    }
}


export async function handleApplication(applicationData) {
    const bot = getSharedBot();
    if (bot) {
        await bot.handleNewApplication(applicationData);
        return true;
    }
    return false;
}


export { getSharedBot };
