import 'server-only';

import { env } from '@/lib/env';

export interface SmsProvider {
  send(toPhoneE164: string, message: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(toPhoneE164: string, message: string): Promise<void> {
    console.log(`[SMS:DEV] → ${toPhoneE164}: ${message}`);
  }
}

// Placeholder for future real provider integration (e.g., smsaero.ru, smsc.ru)
class HttpSmsProvider implements SmsProvider {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}
  async send(toPhoneE164: string, message: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ to: toPhoneE164, message }),
    });
    if (!res.ok) throw new Error(`SMS send failed: ${res.statusText}`);
  }
}

export function getSmsProvider(): SmsProvider {
  const base = env.SMS_BASE_URL;
  const key = env.SMS_API_KEY;
  if (base && key) return new HttpSmsProvider(base, key);
  return new ConsoleSmsProvider();
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
