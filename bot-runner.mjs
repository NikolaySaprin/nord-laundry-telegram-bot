import dotenv from 'dotenv';
import { startSharedBot, stopSharedBot } from './shared-bot.mjs';

// Загружаем переменные окружения
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID;
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === 'true';

console.log('🚀 Запуск объединенного бота (Telegram + WhatsApp)...');

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
  process.exit(1);
}

if (!TELEGRAM_GROUP_CHAT_ID) {
  console.error('❌ TELEGRAM_GROUP_CHAT_ID не найден в переменных окружения');
  process.exit(1);
}

if (ENABLE_WHATSAPP) {
  console.log('✅ WhatsApp включен - будет работать с QR авторизацией');
} else {
  console.log('⚠️ WhatsApp отключен - будет работать только Telegram');
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы...');
  stopSharedBot();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM. Завершение работы...');
  stopSharedBot();
  process.exit(0);
});

// Запускаем бота
try {
  startSharedBot();
  console.log('✅ Объединенный бот запущен успешно!');
} catch (error) {
  console.error('❌ Ошибка запуска бота:', error);
  process.exit(1);
}