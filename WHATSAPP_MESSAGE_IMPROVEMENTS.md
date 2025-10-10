# Улучшения форматирования сообщений WhatsApp

## Проблема
При ответе менеджеров клиентам в WhatsApp передавалась лишняя мета-информация (аватарки, ID сообщений, упоминания пользователей), что загромождало сообщения.

## Решение

### 1. Улучшенная очистка текстовых сообщений

Добавлена агрессивная фильтрация мета-данных:

```typescript
// Удаляем ссылки на Telegram (https://t.me/...)
cleanMessage = cleanMessage.replace(/https:\/\/t\.me\/[^\s\n]+/g, '');

// Удаляем упоминания пользователей (@username)
cleanMessage = cleanMessage.replace(/@[a-zA-Z0-9_]+/g, '');

// Удаляем ID сообщений и другие мета-данные
cleanMessage = cleanMessage.replace(/\[[^\]]+\]/g, '');
cleanMessage = cleanMessage.replace(/\([^)]*message[^)]*\)/gi, '');
cleanMessage = cleanMessage.replace(/\([^)]*thread[^)]*\)/gi, '');

// Удаляем лишние переносы строк и пробелы
cleanMessage = cleanMessage.replace(/\n\s*\n/g, '\n').trim();
cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();

// Удаляем пустые строки в начале и конце
cleanMessage = cleanMessage.replace(/^\s*\n+|\n+\s*$/g, '');
```

### 2. Фильтрация служебных изображений

Добавлен метод `isServiceImage()` для исключения аватарок и служебных изображений:

```typescript
private isServiceImage(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  
  // Проверяем размеры файла в URL
  const sizeMatch = url.match(/[?&]size=(\d+)/);
  if (sizeMatch) {
    const size = parseInt(sizeMatch[1]);
    if (size <= 200) { // Аватарки обычно меньше 200px
      return true;
    }
  }
  
  // Проверяем паттерны URL, указывающие на аватарки
  const avatarPatterns = [
    'avatar', 'profile', 'user_photo', 'chat_photo',
    'thumb', 'thumbnail', 'icon', 'emoji', 'sticker'
  ];
  
  for (const pattern of avatarPatterns) {
    if (lowerUrl.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}
```

### 3. Улучшенная обработка медиа файлов

```typescript
// Отправляем медиа файлы, если есть (исключаем аватарки и служебные изображения)
if (reply.mediaUrls && reply.mediaUrls.length > 0) {
  for (const mediaUrl of reply.mediaUrls) {
    // Пропускаем аватарки и служебные изображения
    if (this.isServiceImage(mediaUrl)) {
      console.log('⏭️ Пропускаем служебное изображение:', mediaUrl);
      continue;
    }
    
    // Определяем тип медиа по URL или расширению
    const mediaType = this.getMediaTypeFromUrl(mediaUrl);
    await this.sendMediaMessage(reply.targetUserId, mediaUrl, mediaType);
  }
}
```

## Результат

### До улучшений:
```
[ID: 123] Ответ менеджера @username
https://t.me/username

[thread_id: 456] Сообщение в теме
```

### После улучшений:
```
Ответ менеджера

📱 Связаться в Telegram: https://t.me/username
```

## Что фильтруется:

### Текстовые сообщения:
- ✅ Ссылки на Telegram (https://t.me/...)
- ✅ Упоминания пользователей (@username)
- ✅ ID сообщений в квадратных скобках [ID: 123]
- ✅ Мета-данные в скобках (message_id, thread_id)
- ✅ Лишние переносы строк и пробелы
- ✅ Пустые строки в начале и конце

### Медиа файлы:
- ✅ Аватарки пользователей (размер ≤ 200px)
- ✅ Иконки и эмодзи
- ✅ Стикеры
- ✅ Миниатюры (thumbnails)
- ✅ Служебные изображения профилей

## Развертывание

1. **Скомпилировать код:**
   ```bash
   npm run build
   ```

2. **Перезапустить бота на VPS:**
   ```bash
   pm2 restart nord-laundry-bot
   ```

3. **Проверить логи:**
   ```bash
   pm2 logs nord-laundry-bot --lines 20
   ```

## Тестирование

1. Отправить сообщение в WhatsApp
2. Ответить на него в Telegram группе
3. Проверить, что в WhatsApp пришел только чистый текст + ссылка на Telegram
4. Убедиться, что аватарки и мета-данные не передаются

## Логирование

Все пропущенные служебные изображения логируются:
```
⏭️ Пропускаем служебное изображение: https://...
```
