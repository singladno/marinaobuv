import { fetchMediaBuffer, setWebhook } from './whapi-api';
import {
  extractMessageText,
  getExtensionFromMime,
  isGroupJid,
  mediaInfo,
} from './whapi-utils';

// Re-export all functions
export {
  extractMessageText,
  fetchMediaBuffer,
  getExtensionFromMime,
  isGroupJid,
  mediaInfo,
  setWebhook,
};
