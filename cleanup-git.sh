#!/bin/bash

# Скрипт для очистки Git репозитория от больших файлов
# Удаляет архивы авторизации WhatsApp из истории Git

set -e

echo "🧹 Очистка Git репозитория от больших файлов..."

# Проверяем, что мы в Git репозитории
if [ ! -d ".git" ]; then
    echo "❌ Не найден Git репозиторий"
    exit 1
fi

# Создаем резервную копию текущего состояния
echo "💾 Создаем резервную копию..."
git branch backup-before-cleanup 2>/dev/null || true

# Удаляем большие файлы из истории Git
echo "🗑️ Удаляем архивы авторизации из истории Git..."

# Список паттернов файлов для удаления
PATTERNS=(
    "whatsapp_auth_*.tar.gz"
    "whatsapp_auth_latest.tar.gz"
    "whatsapp_auth_2025-*.tar.gz"
    "whatsapp_auth_202510*.tar.gz"
)

# Удаляем файлы из истории Git
for pattern in "${PATTERNS[@]}"; do
    echo "🔍 Удаляем файлы по паттерну: $pattern"
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch $pattern" \
        --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
done

# Очищаем ссылки на удаленные объекты
echo "🧹 Очищаем ссылки на удаленные объекты..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin 2>/dev/null || true

# Принудительно очищаем Git
echo "💨 Принудительная очистка Git..."
git reflog expire --expire=now --all 2>/dev/null || true
git gc --prune=now --aggressive 2>/dev/null || true

# Проверяем размер после очистки
echo "📊 Размер Git репозитория после очистки:"
du -sh .git

echo "✅ Очистка завершена!"
echo "💡 Рекомендации:"
echo "   1. Сделайте git push --force-with-lease для обновления удаленного репозитория"
echo "   2. Уведомите других разработчиков о необходимости переклонировать репозиторий"
echo "   3. Убедитесь, что .gitignore правильно настроен для предотвращения повторного добавления больших файлов"
