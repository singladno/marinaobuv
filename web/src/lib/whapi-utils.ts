/**
 * Check if a JID (Jabber ID) represents a WhatsApp group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us');
}

/**
 * Extract text content from WhatsApp message
 */
export function extractMessageText(
  message: Record<string, unknown>
): string | null {
  // Try different message types in order of preference
  if (typeof message.conversation === 'string') {
    return message.conversation;
  }

  const extendedText = message.extendedTextMessage as
    | Record<string, unknown>
    | undefined;
  if (extendedText && typeof extendedText.text === 'string') {
    return extendedText.text;
  }

  const imageMessage = message.imageMessage as
    | Record<string, unknown>
    | undefined;
  if (imageMessage && typeof imageMessage.caption === 'string') {
    return imageMessage.caption;
  }

  const videoMessage = message.videoMessage as
    | Record<string, unknown>
    | undefined;
  if (videoMessage && typeof videoMessage.caption === 'string') {
    return videoMessage.caption;
  }

  const documentMessage = message.documentMessage as
    | Record<string, unknown>
    | undefined;
  if (documentMessage && typeof documentMessage.caption === 'string') {
    return documentMessage.caption;
  }

  return null;
}

/**
 * Get media information from WhatsApp message
 */
export function mediaInfo(
  message: Record<string, unknown>
): { mime?: string; id?: string; url?: string } | null {
  // Check for media in the message object
  const imageMessage = message.imageMessage as
    | Record<string, unknown>
    | undefined;
  if (imageMessage) {
    return {
      mime: imageMessage.mimetype as string,
      id: imageMessage.id as string,
      url: imageMessage.url as string,
    };
  }

  const videoMessage = message.videoMessage as
    | Record<string, unknown>
    | undefined;
  if (videoMessage) {
    return {
      mime: videoMessage.mimetype as string,
      id: videoMessage.id as string,
      url: videoMessage.url as string,
    };
  }

  const documentMessage = message.documentMessage as
    | Record<string, unknown>
    | undefined;
  if (documentMessage) {
    return {
      mime: documentMessage.mimetype as string,
      id: documentMessage.id as string,
      url: documentMessage.url as string,
    };
  }

  // Check for media in the top-level media object
  const media = message.media as Record<string, unknown> | undefined;
  if (media) {
    return {
      mime: media.mimeType as string,
      id: media.id as string,
      url: media.url as string,
    };
  }

  return null;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
  };

  return mimeMap[mimeType] || 'bin';
}
