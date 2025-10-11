#!/bin/bash

# Скрипт для создания минимальной версии проекта
# Удаляет ненужные файлы для уменьшения размера

set -e

echo "🧹 Создание минимальной версии проекта..."

# Создаем резервную копию
echo "💾 Создаем резервную копию..."
cp -r . ../nord-laundry-bot-backup-$(date +%Y%m%d_%H%M%S)

# Удаляем ненужные файлы документации (кроме README.md)
echo "🗑️ Удаляем ненужную документацию..."
find . -name "*.md" -not -name "README.md" -not -path "./node_modules/*" -delete

# Удаляем тестовые файлы
echo "🗑️ Удаляем тестовые файлы..."
rm -f test-*.js test-*.sh

# Удаляем старые скрипты развертывания (оставляем только основные)
echo "🗑️ Удаляем старые скрипты развертывания..."
rm -f deploy.sh auto-upload.sh upload-to-vps.sh vps-diagnostic.sh
rm -f webhook-deploy.sh setup-auto-deploy.sh setup-long-session.sh
rm -f setup-auto-restore.sh auto-restore-auth.sh cleanup-old-archives.sh
rm -f create-auth-archive.sh restore-auth.sh restore-auth-on-vps.sh
rm -f backup-auth.sh check-auth-status.sh check-session.sh
rm -f clear-session.sh clear-thanks-history.sh clear-welcome-history.sh
rm -f monitor-session.sh test-chat-open.sh test-thanks-messages.sh
rm -f test-welcome-messages.sh test-long-session.sh

# Удаляем старые конфигурационные файлы
echo "🗑️ Удаляем старые конфигурационные файлы..."
rm -f whatsapp-auth-restore.service
rm -f ecosystem.config.cjs

# Удаляем логи
echo "🗑️ Очищаем логи..."
rm -rf logs/*

# Удаляем временные файлы
echo "🗑️ Удаляем временные файлы..."
rm -f *.tmp *.temp *.log

# Удаляем старые архивы авторизации (оставляем только latest)
echo "🗑️ Удаляем старые архивы авторизации..."
find . -name "whatsapp_auth_*.tar.gz" -not -name "whatsapp_auth_latest.tar.gz" -delete

# Очищаем Git от удаленных файлов
echo "🧹 Очищаем Git от удаленных файлов..."
git add -A
git commit -m "Cleanup: remove unnecessary files for minimal version" || true

# Проверяем размер после очистки
echo "📊 Размер проекта после очистки:"
du -sh .

echo "✅ Минимальная версия создана!"
echo "💡 Рекомендации:"
echo "   1. Проверьте, что все необходимые файлы остались"
echo "   2. Протестируйте работу бота"
echo "   3. При необходимости восстановите файлы из резервной копии"