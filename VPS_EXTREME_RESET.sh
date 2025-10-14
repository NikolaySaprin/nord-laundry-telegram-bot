#!/bin/bash

# ЭКСТРЕМАЛЬНАЯ ОЧИСТКА WhatsApp - используйте когда стандартная очистка не помогла
# Этот скрипт удаляет ВСЕ следы старой авторизации включая Chrome кэши

echo "💥 ЭКСТРЕМАЛЬНАЯ ОЧИСТКА WHATSAPP + CHROME КЭШЕЙ"
echo "================================================="
echo ""
echo "⚠️  Это удалит:"
echo "   - Все данные WhatsApp сессий"
echo "   - Все Chrome/Chromium кэши и профили"
echo "   - Все Puppeteer временные файлы"
echo "   - Все PM2 логи"
echo ""
read -p "Продолжить? Введите 'yes': " -r
echo ""

if [[ ! $REPLY == "yes" ]]; then
    echo "Отменено пользователем"
    exit 0
fi

# Переходим в директорию проекта
cd /var/www/html/nord-laundry-telegram-bot 2>/dev/null || {
    echo "❌ Не найдена директория /var/www/html/nord-laundry-telegram-bot"
    echo "Укажите правильный путь и запустите скрипт из директории проекта"
    exit 1
}

echo "📍 Текущая директория: $(pwd)"
echo ""

# ============================================
# ШАГ 1: Убиваем ВСЕ процессы
# ============================================
echo "🔪 ШАГ 1: Завершение всех процессов..."
pm2 kill 2>/dev/null
pkill -9 node 2>/dev/null
pkill -9 chromium 2>/dev/null
pkill -9 chrome 2>/dev/null
pkill -9 chromium-browser 2>/dev/null
echo "✅ Все процессы завершены"
sleep 3

# ============================================
# ШАГ 2: Удаляем WhatsApp данные
# ============================================
echo ""
echo "🗑️  ШАГ 2: Удаление WhatsApp данных..."

# Основная папка сессии
if [ -d ".wwebjs_auth" ]; then
    chmod -R 777 .wwebjs_auth/ 2>/dev/null
    rm -rf .wwebjs_auth/
    sudo rm -rf .wwebjs_auth/ 2>/dev/null
    echo "✅ .wwebjs_auth удалена"
else
    echo "✅ .wwebjs_auth не найдена"
fi

# Архивы
rm -f whatsapp_auth_*.tar.gz 2>/dev/null
sudo rm -f whatsapp_auth_*.tar.gz 2>/dev/null
find . -name "whatsapp_auth_*.tar.gz" -delete 2>/dev/null
echo "✅ Архивы удалены"

# ============================================
# ШАГ 3: ПОЛНАЯ очистка Chrome/Chromium
# ============================================
echo ""
echo "🧹 ШАГ 3: ГЛУБОКАЯ ОЧИСТКА CHROME КЭШЕЙ..."
echo "   ⚡ Это самое важное для сброса старой сессии!"
echo ""

# /tmp директория
echo "   🗑️  Очистка /tmp..."
sudo rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null
sudo rm -rf /tmp/puppeteer_dev_chrome_profile-* 2>/dev/null
sudo rm -rf /tmp/chrome-* 2>/dev/null
sudo rm -rf /tmp/chromium-* 2>/dev/null
sudo rm -rf /tmp/.chromium-* 2>/dev/null
sudo rm -rf /tmp/wwebjs_* 2>/dev/null
sudo rm -rf /tmp/puppeteer* 2>/dev/null
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null
rm -rf /tmp/puppeteer_dev_chrome_profile-* 2>/dev/null
rm -rf /tmp/chrome-* 2>/dev/null
rm -rf /tmp/chromium-* 2>/dev/null
rm -rf /tmp/wwebjs_* 2>/dev/null
echo "   ✅ /tmp очищен"

# /var/tmp директория
echo "   🗑️  Очистка /var/tmp..."
sudo rm -rf /var/tmp/chrome-* 2>/dev/null
sudo rm -rf /var/tmp/chromium-* 2>/dev/null
echo "   ✅ /var/tmp очищен"

# Домашняя директория текущего пользователя
echo "   🗑️  Очистка ~/.config и ~/.cache..."
rm -rf ~/.config/chromium/ 2>/dev/null
rm -rf ~/.config/google-chrome/ 2>/dev/null
rm -rf ~/.cache/chromium/ 2>/dev/null
rm -rf ~/.cache/google-chrome/ 2>/dev/null
rm -rf ~/.cache/puppeteer/ 2>/dev/null
rm -rf ~/.local/share/chromium/ 2>/dev/null
echo "   ✅ Домашняя директория очищена"

# Root директория
echo "   🗑️  Очистка /root..."
sudo rm -rf /root/.config/chromium/ 2>/dev/null
sudo rm -rf /root/.cache/chromium/ 2>/dev/null
sudo rm -rf /root/.local/share/chromium/ 2>/dev/null
echo "   ✅ Root директория очищена"

# Поиск и удаление оставшихся профилей
echo "   🔍 Поиск оставшихся Chrome профилей..."
FOUND_PROFILES=$(find /tmp /var/tmp -name "*chromium*" -o -name "*chrome*" -o -name "*puppeteer*" 2>/dev/null | wc -l)
echo "   📊 Найдено профилей: $FOUND_PROFILES"

if [ "$FOUND_PROFILES" -gt 0 ]; then
    echo "   🗑️  Удаление найденных профилей..."
    find /tmp -name "*chromium*" -type d -exec rm -rf {} + 2>/dev/null
    find /tmp -name "*chrome*" -type d -exec rm -rf {} + 2>/dev/null
    find /tmp -name "*puppeteer*" -type d -exec rm -rf {} + 2>/dev/null
    find /var/tmp -name "*chromium*" -type d -exec rm -rf {} + 2>/dev/null
    find /var/tmp -name "*chrome*" -type d -exec rm -rf {} + 2>/dev/null
    echo "   ✅ Профили удалены"
else
    echo "   ✅ Дополнительных профилей не найдено"
fi

echo "✅ Chrome кэши полностью очищены"

# ============================================
# ШАГ 4: Очистка PM2
# ============================================
echo ""
echo "🗑️  ШАГ 4: Очистка PM2..."
pm2 flush 2>/dev/null
rm -rf ~/.pm2/logs/* 2>/dev/null
rm -rf ~/.pm2/pids/* 2>/dev/null
echo "✅ PM2 очищен"

# ============================================
# ШАГ 5: Очистка Node кэшей
# ============================================
echo ""
echo "🗑️  ШАГ 5: Очистка Node кэшей..."
rm -rf node_modules/.cache 2>/dev/null
npm cache clean --force 2>/dev/null
echo "✅ Node кэши очищены"

# ============================================
# ФИНАЛЬНАЯ ПРОВЕРКА
# ============================================
echo ""
echo "======================================"
echo "📋 ФИНАЛЬНАЯ ПРОВЕРКА"
echo "======================================"

ERRORS=0

# Проверка .wwebjs_auth
if [ -d ".wwebjs_auth" ]; then
    echo "❌ .wwebjs_auth/ всё ещё существует!"
    ERRORS=$((ERRORS+1))
else
    echo "✅ .wwebjs_auth/ удалена"
fi

# Проверка архивов
if ls whatsapp_auth_*.tar.gz 1> /dev/null 2>&1; then
    echo "❌ Найдены архивы"
    ERRORS=$((ERRORS+1))
else
    echo "✅ Архивы удалены"
fi

# Проверка Chrome профилей
CHROME_PROFILES=$(find /tmp /var/tmp -name "*chromium*" -o -name "*chrome*" 2>/dev/null | wc -l)
if [ "$CHROME_PROFILES" -gt 5 ]; then
    echo "⚠️  Найдено $CHROME_PROFILES Chrome профилей (могут быть системные)"
else
    echo "✅ Chrome профили очищены"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉🎉🎉 ВСЁ ОТЛИЧНО! ГОТОВО К НОВОЙ АВТОРИЗАЦИИ!"
else
    echo "⚠️  Обнаружены проблемы, но можно попробовать авторизоваться"
fi

# ============================================
# ИНСТРУКЦИИ
# ============================================
echo ""
echo "======================================"
echo "📱 СЛЕДУЮЩИЕ ШАГИ:"
echo "======================================"
echo ""
echo "1. Убедитесь что в .env установлено:"
echo "   ENABLE_WHATSAPP=true"
echo "   CREATE_AUTH_ARCHIVE=false"
echo ""
echo "   Проверить: cat .env | grep -E 'ENABLE_WHATSAPP|CREATE_AUTH_ARCHIVE'"
echo ""
echo "2. Пересоберите и запустите:"
echo "   npm run build"
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo ""
echo "3. Следите за логами:"
echo "   pm2 logs nord-laundry-bot"
echo ""
echo "4. Дождитесь QR кода и отсканируйте его"
echo "   с ПРАВИЛЬНОГО телефона (нужный номер WhatsApp)"
echo ""
echo "5. После авторизации проверьте в логах:"
echo "   📱 ИНФОРМАЦИЯ О WHATSAPP АККАУНТЕ:"
echo "   📱 Номер телефона: ВАШИ_ЦИФРЫ"
echo "   Убедитесь что это ПРАВИЛЬНЫЙ номер!"
echo ""
echo "6. Отправьте тестовое сообщение и проверьте логи:"
echo "   🔔 ПОЛУЧЕНО СОБЫТИЕ MESSAGE ОТ WHATSAPP"
echo "   🚀 ПЕРЕСЫЛАЕМ ЗАЯВКУ В TELEGRAM"
echo ""
echo "======================================"
echo "✅ СКРИПТ ЗАВЕРШЁН"
echo "======================================"
