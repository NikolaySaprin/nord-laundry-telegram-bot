#!/bin/bash

# Скрипт для очистки проекта от ненужных файлов

echo "🧹 Очистка проекта от ненужных файлов..."

# Удаляем старые архивы авторизации
echo "🗑️ Удаляем старые архивы авторизации..."
find . -name "whatsapp_auth_2025-*.tar.gz" -type f -delete 2>/dev/null || true

# Удаляем документацию (кроме README)
echo "📚 Удаляем документацию..."
find . -name "*.md" -not -name "README.md" -type f -delete 2>/dev/null || true

# Удаляем тестовые файлы
echo "🧪 Удаляем тестовые файлы..."
find . -name "test-*.js" -type f -delete 2>/dev/null || true
find . -name "test-*.sh" -type f -delete 2>/dev/null || true

# Удаляем скрипты развертывания (опционально)
echo "🚀 Удаляем скрипты развертывания..."
rm -f deploy.sh auto-upload.sh upload-to-vps.sh vps-diagnostic.sh
rm -f webhook-deploy.sh setup-auto-deploy.sh setup-long-session.sh
rm -f setup-auto-restore.sh auto-restore-auth.sh cleanup-old-archives.sh
rm -f create-auth-archive.sh restore-auth.sh restore-auth-on-vps.sh
rm -f backup-auth.sh check-auth-status.sh check-session.sh
rm -f clear-session.sh clear-thanks-history.sh clear-welcome-history.sh
rm -f monitor-session.sh test-chat-open.sh test-thanks-messages.sh
rm -f test-welcome-messages.sh test-long-session.sh
rm -f whatsapp-auth-restore.service

# Удаляем service файлы
echo "⚙️ Удаляем service файлы..."
rm -f ecosystem.config.cjs

# Очищаем git кэш (если нужно)
echo "🔧 Очищаем git кэш..."
git gc --prune=now 2>/dev/null || true

# Показываем размер после очистки
echo "📊 Размер проекта после очистки:"
du -sh . 2>/dev/null || echo "Не удалось определить размер"

echo "✅ Очистка завершена!"
echo ""
echo "💡 Для продакшена используйте только:"
echo "  • src/ - исходный код"
echo "  • dist/ - скомпилированный код"
echo "  • package.json - зависимости"
echo "  • .env - переменные окружения"
echo "  • bot-runner.mjs - запуск бота"
echo "  • webhook-server.js - webhook сервер"
echo "  • shared-bot.js - общий экземпляр бота"
