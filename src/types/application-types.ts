import { z } from 'zod';

// Схема валидации для данных формы
export const applicationFormSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  phone: z.string().regex(/^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/, "Введите корректный номер телефона"),
  sphere: z.string().optional(), // Необязательное поле
  privacy: z.boolean().refine((val: boolean) => val === true, "Необходимо согласие с политикой конфиденциальности")
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;

// Тип для заявки, которая передается в систему
export type Application = {
  name: string;
  phone: string;
  sphere?: string;
  source: 'website_form' | 'whatsapp' | 'telegram_direct' | 'contact_form' | 'bottom_form' | 'services_form' | 'modal_form';
  userIdentifierTelegram?: string;
  userNameTelegram?: string; // Для Telegram: имя пользователя
  userUsernameTelegram?: string; // Для Telegram: username
  userMessage?: string; // Вопрос от пользователя
  telegramUserId?: number; // ID пользователя в Telegram
}