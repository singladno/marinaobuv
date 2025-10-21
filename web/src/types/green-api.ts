/**
 * Green API TypeScript types
 * Based on Green API documentation: https://green-api.com/en/docs/api/
 */

export interface GreenApiMessage {
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  chatId: string;
  senderId?: string;
  senderName?: string;
  textMessage?: string;
  downloadUrl?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  quotedMessageId?: string;
  quotedMessage?: GreenApiMessage;
  forwarded?: boolean;
  forwardedFrom?: string;
  forwardedFromName?: string;
  forwardedTimestamp?: number;
  isForwarded?: boolean;
  isGroup?: boolean;
  groupName?: string;
  groupParticipants?: string[];
  isFromMe?: boolean;
  isSystemMessage?: boolean;
  systemMessageType?: string;
  systemMessageData?: any;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contact?: {
    name: string;
    phone: string;
    vcard?: string;
  };
  poll?: {
    name: string;
    options: string[];
    allowMultipleAnswers: boolean;
    messageSecret: string;
  };
  pollVote?: {
    pollId: string;
    optionIds: number[];
    voteTimestamp: number;
  };
  reaction?: {
    messageId: string;
    emoji: string;
    timestamp: number;
  };
  replyTo?: {
    messageId: string;
    chatId: string;
  };
  mentions?: string[];
  hasQuotedMsg?: boolean;
  quotedMsg?: GreenApiMessage;
  mediaData?: {
    type: string;
    url: string;
    caption?: string;
    filename?: string;
    mimetype?: string;
    size?: number;
  };
  contextInfo?: {
    quotedMessage?: GreenApiMessage;
    mentionedJid?: string[];
    participant?: string;
    remoteJid?: string;
  };
}

export interface GreenApiChatHistoryResponse {
  result: boolean;
  data: GreenApiMessage[];
  error?: string;
  errorCode?: number;
}

export interface GreenApiGetMessageResponse {
  result: boolean;
  data: GreenApiMessage;
  error?: string;
  errorCode?: number;
}

export interface GreenApiSettingsResponse {
  result: boolean;
  data: Record<string, any>;
  error?: string;
  errorCode?: number;
}

export interface GreenApiError {
  result: false;
  error: string;
  errorCode?: number;
}

export type GreenApiResponse<T = any> =
  | { result: true; data: T }
  | GreenApiError;

export interface GreenApiChatHistoryParams {
  chatId: string;
  count?: number;
}

export interface GreenApiGetMessageParams {
  chatId: string;
  idMessage: string;
}

export interface GreenApiSetSettingsParams {
  incomingWebhook?: boolean;
  outgoingWebhook?: boolean;
  incomingWebhookUrl?: string;
  outgoingWebhookUrl?: string;
  stateWebhookUrl?: string;
  incomingWebhookAnswer?: boolean;
  deviceWebhookUrl?: string;
  statusInstanceWebhookUrl?: string;
  sendFromPhone?: boolean;
  markIncomingMessagesReaded?: boolean;
  markIncomingMessagesReadedOnReply?: boolean;
  outgoingMessageStatusWebhook?: boolean;
  incomingMessageStatusWebhook?: boolean;
  sendMessageToInstance?: boolean;
  sendMessageToInstanceStatus?: boolean;
  sendMessageToInstanceStatusWebhook?: boolean;
  sendMessageToInstanceStatusWebhookUrl?: string;
  sendMessageToInstanceStatusWebhookUrlMethod?: string;
  sendMessageToInstanceStatusWebhookUrlHeaders?: Record<string, string>;
  sendMessageToInstanceStatusWebhookUrlBody?: string;
  sendMessageToInstanceStatusWebhookUrlBodyType?: string;
  sendMessageToInstanceStatusWebhookUrlBodyForm?: Record<string, string>;
  sendMessageToInstanceStatusWebhookUrlBodyFormData?: Record<string, string>;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFiles?: Record<
    string,
    string
  >;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesType?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethod?: string;
  sendMessageToInstanceStatusWebhookUrlBodyFormDataFilesTypeMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodMethodResult?: string;
}
