import { z } from 'zod';

// Loose Zod schemas for Evolution API webhook payloads
// We only validate the fields we actually need to ensure resilience

export const MessageKeySchema = z.object({
  remoteJid: z.string(),
  fromMe: z.boolean(),
  id: z.string(),
}).passthrough(); // Allow additional fields

export const MediaSchema = z.object({
  base64: z.string().optional(),
  url: z.string().optional(),
  mimetype: z.string().optional(),
}).passthrough();

export const ImageMessageSchema = z.object({
  caption: z.string().optional(),
  mimetype: z.string().optional(),
  base64: z.string().optional(),
  url: z.string().optional(),
}).passthrough();

export const VideoMessageSchema = z.object({
  caption: z.string().optional(),
  mimetype: z.string().optional(),
  base64: z.string().optional(),
  url: z.string().optional(),
}).passthrough();

export const DocumentMessageSchema = z.object({
  caption: z.string().optional(),
  mimetype: z.string().optional(),
  base64: z.string().optional(),
  url: z.string().optional(),
}).passthrough();

export const ExtendedTextMessageSchema = z.object({
  text: z.string().optional(),
}).passthrough();

export const MessageSchema = z.object({
  conversation: z.string().optional(),
  extendedTextMessage: ExtendedTextMessageSchema.optional(),
  imageMessage: ImageMessageSchema.optional(),
  videoMessage: VideoMessageSchema.optional(),
  documentMessage: DocumentMessageSchema.optional(),
}).passthrough();

export const MessagesUpsertDataSchema = z.object({
  key: MessageKeySchema,
  messageType: z.string().optional(),
  message: MessageSchema.optional(),
  pushName: z.string().optional(),
  timestamp: z.number().optional(),
  media: MediaSchema.optional(),
}).passthrough();

export const MessagesUpsertPayloadSchema = z.object({
  event: z.literal('MESSAGES_UPSERT'),
  instance: z.string().optional(),
  data: MessagesUpsertDataSchema,
}).passthrough();

export const MessagesUpdateDataSchema = z.object({
  key: MessageKeySchema,
  messageType: z.string().optional(),
  message: MessageSchema.optional(),
  pushName: z.string().optional(),
  timestamp: z.number().optional(),
}).passthrough();

export const MessagesUpdatePayloadSchema = z.object({
  event: z.literal('MESSAGES_UPDATE'),
  instance: z.string().optional(),
  data: MessagesUpdateDataSchema,
}).passthrough();

export const MessagesDeleteDataSchema = z.object({
  key: MessageKeySchema,
}).passthrough();

export const MessagesDeletePayloadSchema = z.object({
  event: z.literal('MESSAGES_DELETE'),
  instance: z.string().optional(),
  data: MessagesDeleteDataSchema,
}).passthrough();

// Union of all supported webhook payloads
export const WebhookPayloadSchema = z.union([
  MessagesUpsertPayloadSchema,
  MessagesUpdatePayloadSchema,
  MessagesDeletePayloadSchema,
]);

// Type exports
export type MessageKey = z.infer<typeof MessageKeySchema>;
export type Media = z.infer<typeof MediaSchema>;
export type ImageMessage = z.infer<typeof ImageMessageSchema>;
export type VideoMessage = z.infer<typeof VideoMessageSchema>;
export type DocumentMessage = z.infer<typeof DocumentMessageSchema>;
export type ExtendedTextMessage = z.infer<typeof ExtendedTextMessageSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type MessagesUpsertData = z.infer<typeof MessagesUpsertDataSchema>;
export type MessagesUpsertPayload = z.infer<typeof MessagesUpsertPayloadSchema>;
export type MessagesUpdateData = z.infer<typeof MessagesUpdateDataSchema>;
export type MessagesUpdatePayload = z.infer<typeof MessagesUpdatePayloadSchema>;
export type MessagesDeleteData = z.infer<typeof MessagesDeleteDataSchema>;
export type MessagesDeletePayload = z.infer<typeof MessagesDeletePayloadSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// Helper type guards
export function isMessagesUpsert(payload: WebhookPayload): payload is MessagesUpsertPayload {
  return payload.event === 'MESSAGES_UPSERT';
}

export function isMessagesUpdate(payload: WebhookPayload): payload is MessagesUpdatePayload {
  return payload.event === 'MESSAGES_UPDATE';
}

export function isMessagesDelete(payload: WebhookPayload): payload is MessagesDeletePayload {
  return payload.event === 'MESSAGES_DELETE';
}
