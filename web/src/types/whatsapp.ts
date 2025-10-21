export interface WhatsAppMessage {
  id: string;
  waMessageId: string;
  from?: string | null;
  fromName?: string | null;
  type?: string | null;
  text?: string | null;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  mediaFileSize?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
