#!/bin/bash

echo "🧹 Очистка сессии WhatsApp..."

# Останавливаем все процессы Node.js (осторожно!)
echo "⏹️ Останавливаем процессы Node.js..."
pkill -f "node.*bot-runner" || true
pkill -f "node.*whatsapp" || true

# Ждем немного
sleep 2

# Удаляем папку с сессией
echo "🗑️ Удаляем папку сессии..."
rm -rf .wwebjs_auth/

echo "✅ Сессия очищена!"
echo "💡 Теперь запустите бота заново: npm start"
echo "📱 Отсканируйте QR код для новой авторизации"
