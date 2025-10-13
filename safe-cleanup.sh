#!/bin/bash

# Скрипт для безопасной очистки проекта от ненужных файлов
# Удаляет только файлы, которые не нужны в продакшене

set -e

echo "🧹 Очистка проекта от ненужных файлов..."
echo ""

# Функция для безопасного удаления файла
safe_remove() {
    local file=$1
    if [ -f "$file" ]; then
        echo "🗑️  Удаляем: $file"
        rm "$file"
    else
        echo "⏭️  Файл не найден (пропускаем): $file"
    fi
}

# Удаляем скрипты для разработки
echo "📝 Удаляем скрипты для разработки..."
safe_remove "cleanup-git.sh"
safe_remove "cleanup-project.sh"
safe_remove "create-minimal-version.sh"
safe_remove "auto-auth-recovery.sh"
safe_remove "setup-auth-recovery.sh"
safe_remove "whatsapp-auth-recovery.service"

# Удаляем конфигурационные файлы для разработки
echo ""
echo "⚙️  Удаляем конфигурационные файлы для разработки..."
safe_remove ".gitignore.production"
safe_remove "package.production.json"

# Удаляем старые архивы авторизации (оставляем только latest)
echo ""
echo "📦 Удаляем старые архивы авторизации..."
find . -maxdepth 1 -name "whatsapp_auth_*.tar.gz" -not -name "whatsapp_auth_latest.tar.gz" -type f -delete 2>/dev/null || true

# Удаляем временные файлы
echo ""
echo "🧹 Удаляем временные файлы..."
find . -maxdepth 1 -name "*.tmp" -type f -delete 2>/dev/null || true
find . -maxdepth 1 -name "*.temp" -type f -delete 2>/dev/null || true
find . -maxdepth 1 -name ".DS_Store" -type f -delete 2>/dev/null || true

echo ""
echo "✅ Очистка завершена!"
echo ""
echo "📊 Оставшиеся файлы проекта:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh | grep -v "^d" | grep -v "node_modules" | tail -n +2 || true
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Рекомендации:"
echo "   1. Проверьте, что все необходимые файлы остались"
echo "   2. Скомпилируйте проект: npm run build"
echo "   3. Протестируйте работу бота: npm start"
echo "   4. Создайте коммит: git add . && git commit -m 'Cleanup: remove development files'"
echo ""
echo "🚀 Проект готов к развертыванию на VPS!"
