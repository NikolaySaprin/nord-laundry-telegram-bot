export type Application = {
  name: string;
  phone: string;
  sphere?: string;
  source: 'website_form' | 'whatsapp' | 'telegram_direct' | 'contact_form' | 'bottom_form' | 'services_form' | 'modal_form';
  userIdentifierTelegram?: string;
  userNameTelegram?: string;
  userUsernameTelegram?: string;
  userMessage?: string;
  telegramUserId?: number;
  
  // WhatsApp specific fields
  whatsappUserId?: string;
  whatsappUserName?: string;
  whatsappUserPhone?: string;
  
  // Media support
  mediaUrls?: string[];
  messageType: 'text' | 'image' | 'video' | 'document' | 'audio';
};

export type ManagerReply = {
  threadId: number;
  targetUserId: string;
  targetPlatform: 'telegram' | 'whatsapp';
  managerName: string;
  managerUsername: string;
  message: string;
  mediaUrls?: string[];
};