import 'server-only';

import { env } from '@/lib/env';

export interface SmsProvider {
  send(toPhoneE164: string, message: string): Promise<void>;
}

// SMS.ru provider implementation
class SmsRuProvider implements SmsProvider {
  constructor(private apiKey: string) {}

  async send(toPhoneE164: string, message: string): Promise<void> {
    // Remove + from phone number for SMS.ru
    const phone = toPhoneE164.replace('+', '');

    const formData = new URLSearchParams({
      api_id: this.apiKey,
      to: phone,
      msg: message,
      json: '1',
      test: '1', // Use test mode until sender is approved
      // from: 'MarinaObuv', // Will be enabled once sender is approved
    });

    const res = await fetch('https://sms.ru/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`SMS.ru API error: ${res.statusText}`);
    }

    const result = await res.json();

    if (result.status !== 'OK') {
      throw new Error(
        `SMS.ru send failed: ${result.status_text || 'Unknown error'}`
      );
    }
  }
}

export function getSmsProvider(): SmsProvider {
  const key = env.SMS_API_KEY;
  if (!key) {
    throw new Error('SMS_API_KEY is required for SMS sending');
  }

  // Check if we're in development mode and SMS.ru is not configured
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️  SMS.ru sender not configured. Using console fallback for development.'
    );
    return new ConsoleSmsProvider();
  }

  // In production, check if we should use console fallback
  // This can be controlled by SMS_USE_CONSOLE environment variable
  if (env.SMS_USE_CONSOLE === 'true') {
    console.warn(
      '⚠️  SMS_USE_CONSOLE=true. Using console fallback for SMS in production.'
    );
    return new ConsoleSmsProvider();
  }

  return new SmsRuProvider(key);
}

// Console provider for development and production fallback
class ConsoleSmsProvider implements SmsProvider {
  async send(toPhoneE164: string, message: string): Promise<void> {
    console.log(`📱 [SMS] → ${toPhoneE164}: ${message}`);
    console.log('⚠️  SMS.ru sender not configured. Using console fallback.');
    console.log(
      '🔧 To enable real SMS sending, configure SMS.ru sender in dashboard.'
    );
  }
}

export function normalizePhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.startsWith('7')) return `+7${digits.slice(1)}`;
  if (digits.startsWith('0')) return `+7${digits.slice(1)}`;
  if (digits.startsWith('9') && digits.length === 10) return `+7${digits}`;
  if (digits.startsWith('89') && digits.length === 11)
    return `+7${digits.slice(1)}`;
  return `+${digits}`;
}
