import dotenv from 'dotenv';
import { ApplicationBot } from './dist/lib/telegram-bot.js';

// Загружаем переменные окружения из .env файла
dotenv.config();

console.log('Запуск Telegram бота...');

// Проверяем наличие обязательных переменных окружения
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Ошибка: TELEGRAM_BOT_TOKEN не найден в переменных окружения');
  process.exit(1);
}

if (!process.env.TELEGRAM_GROUP_CHAT_ID) {
  console.error('Ошибка: TELEGRAM_GROUP_CHAT_ID не найден в переменных окружения');
  process.exit(1);
}

const bot = new ApplicationBot(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_GROUP_CHAT_ID
);

bot.start();