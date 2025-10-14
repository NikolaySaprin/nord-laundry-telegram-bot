#!/bin/bash
# Скрипт для принудительного сброса WhatsApp на VPS

echo "🔥 ПРИНУДИТЕЛЬНЫЙ СБРОС WHATSAPP АВТОРИЗАЦИИ"
echo "============================================"

# Останавливаем бота
pm2 stop all
pm2 delete all
sleep 2

# Убиваем все Node процессы
pkill -9 node 2>/dev/null
sleep 2

# Удаляем сессию вручную
rm -rf .wwebjs_auth/
rm -f whatsapp_auth_*.tar.gz

# Добавляем WHATSAPP_FORCE_RESET в .env
if grep -q "WHATSAPP_FORCE_RESET" .env; then
    sed -i 's/WHATSAPP_FORCE_RESET=.*/WHATSAPP_FORCE_RESET=true/' .env
else
    echo "WHATSAPP_FORCE_RESET=true" >> .env
fi

echo "✅ WHATSAPP_FORCE_RESET=true добавлено в .env"

# Собираем проект
npm run build

# Запускаем бота
pm2 start bot-runner.mjs --name laundry-bot

echo ""
echo "📱 Смотрите логи для QR кода:"
echo "   pm2 logs laundry-bot"
echo ""
echo "⚠️  ВАЖНО: После успешной авторизации выполните:"
echo "   sed -i '/WHATSAPP_FORCE_RESET/d' .env"
echo "   pm2 restart laundry-bot"
