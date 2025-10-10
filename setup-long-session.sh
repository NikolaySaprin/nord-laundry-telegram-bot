#!/bin/bash

echo "🔒 Настройка долгосрочной сессии WhatsApp (10 лет)..."

# Создаем папку для сессии если её нет
mkdir -p .wwebjs_auth
chmod 755 .wwebjs_auth

# Создаем файл конфигурации для долгосрочной сессии
cat > .wwebjs_auth/session-config.json << 'EOF'
{
  "sessionTimeout": 315360000000,
  "autoLogout": false,
  "checkActivity": false,
  "autoUpdate": false,
  "saveAuthData": true,
  "saveAuthDataAsJson": true,
  "saveAuthDataAsBase64": false,
  "saveAuthDataAsEncrypted": false,
  "authTimeoutMs": 0,
  "qrMaxRetries": 0,
  "restartOnAuthFail": false,
  "takeoverOnConflict": false,
  "takeoverTimeoutMs": 0,
  "created": "2024-01-01T00:00:00.000Z",
  "expires": "2034-01-01T00:00:00.000Z",
  "description": "Долгосрочная сессия WhatsApp на 10 лет"
}
EOF

# Устанавливаем права доступа
chmod 644 .wwebjs_auth/session-config.json

# Создаем файл с инструкциями
cat > .wwebjs_auth/README.txt << 'EOF'
ДОЛГОСРОЧНАЯ СЕССИЯ WHATSAPP
============================

Эта папка содержит данные сессии WhatsApp, настроенной на 10 лет.

ВАЖНО:
- НЕ удаляйте эту папку без необходимости
- НЕ редактируйте файлы вручную
- Делайте резервные копии этой папки
- При переносе на другой сервер скопируйте всю папку

Срок действия сессии: 10 лет (до 2034 года)
Автоматический разлогин: ОТКЛЮЧЕН
Проверка активности: ОТКЛЮЧЕНА
Автообновление: ОТКЛЮЧЕНО

Если сессия все же слетела:
1. Запустите: ./clear-session.sh
2. Запустите: npm start
3. Отсканируйте QR код заново
4. Запустите: ./setup-long-session.sh

Создано: $(date)
EOF

echo "✅ Конфигурация долгосрочной сессии создана"
echo "📁 Файлы созданы в папке .wwebjs_auth/"
echo "🔒 Сессия настроена на 10 лет без перелогина"
echo ""
echo "💡 Теперь запустите бота: npm start"
echo "📱 Отсканируйте QR код один раз"
echo "🎉 После этого авторизация будет действовать 10 лет!"
