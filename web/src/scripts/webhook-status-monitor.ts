#!/usr/bin/env tsx

/**
 * Webhook Status Monitor
 * Checks Green API instance status and sends Telegram notifications when disconnected
 * or when webhook settings are wrong. Supports two instances: product parser + admin chat.
 */

import './load-env';
import { env } from '../lib/env';
import { getGreenApiIncomingWebhookUrl } from '../lib/server/green-webhook-relay';
import { prisma } from '../lib/db-node';
import { getTelegramNotifier } from '../lib/utils/telegram-notifier';

interface WebhookStatus {
  isConnected: boolean;
  lastCheck: Date;
  errorMessage?: string;
  instanceStatus?: string;
}

type InstanceRole = 'product-parser' | 'admin-chat';

function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function defaultHeadline(role: InstanceRole): string {
  if (role === 'product-parser') {
    return (
      env.WEBHOOK_NOTIFICATION_MESSAGE ||
      '⚠️ Product parser WhatsApp (Green API — catalog / WA_CHAT_IDS): instance not OK.'
    );
  }
  return (
    env.WEBHOOK_NOTIFICATION_MESSAGE_ADMIN ||
    '⚠️ Admin chat WhatsApp (Green API — support inbox): instance not OK.'
  );
}

export class WebhookStatusMonitor {
  private baseUrl: string;
  private notificationsEnabled: boolean;

  constructor() {
    this.baseUrl = env.GREEN_API_BASE_URL || 'https://api.green-api.com';
    this.notificationsEnabled = env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true';
  }

  /**
   * Check one Green API instance (authorized + webhook URL + incoming webhook on).
   */
  async checkInstanceStatus(
    instanceId: string,
    token: string
  ): Promise<WebhookStatus> {
    try {
      const stateResponse = await fetch(
        `${this.baseUrl}/waInstance${instanceId}/getStateInstance/${token}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!stateResponse.ok) {
        throw new Error(
          `HTTP ${stateResponse.status}: ${stateResponse.statusText}`
        );
      }

      const stateData = await stateResponse.json();

      const isConnected = stateData.stateInstance === 'authorized';
      const instanceStatus = stateData.stateInstance;

      if (!isConnected) {
        return {
          isConnected: false,
          lastCheck: new Date(),
          errorMessage: `Instance state: ${instanceStatus}`,
          instanceStatus,
        };
      }

      const settingsResponse = await fetch(
        `${this.baseUrl}/waInstance${instanceId}/getSettings/${token}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!settingsResponse.ok) {
        throw new Error(
          `Settings check failed: HTTP ${settingsResponse.status}`
        );
      }

      const settingsData = await settingsResponse.json();

      if (settingsData.incomingWebhook !== 'yes') {
        return {
          isConnected: false,
          lastCheck: new Date(),
          errorMessage:
            'Incoming webhook is not enabled — messages will not be received',
          instanceStatus,
        };
      }

      const webhookUrl = settingsData.webhookUrl;
      const expectedWebhookUrl = getGreenApiIncomingWebhookUrl();

      if (!webhookUrl || webhookUrl !== expectedWebhookUrl) {
        return {
          isConnected: false,
          lastCheck: new Date(),
          errorMessage: `Webhook URL mismatch. Expected: ${expectedWebhookUrl}, Got: ${webhookUrl || 'not set'}`,
          instanceStatus,
        };
      }

      return {
        isConnected: true,
        lastCheck: new Date(),
        instanceStatus,
      };
    } catch (error) {
      return {
        isConnected: false,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendNotification(message: string): Promise<void> {
    if (!this.notificationsEnabled) {
      console.log('📵 Notifications disabled');
      return;
    }

    const telegramNotifier = getTelegramNotifier();

    if (!telegramNotifier.isConfigured()) {
      console.error(
        '❌ Telegram notifications not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_IDS (comma-separated list of chat IDs) in .env'
      );
      return;
    }

    try {
      await telegramNotifier.sendMessage(message);
      console.log('✅ Telegram notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Telegram notification:', error);
      throw error;
    }
  }

  async saveStatusToDatabase(
    status: WebhookStatus,
    instanceLabel: string
  ): Promise<void> {
    try {
      await (prisma as any).webhookStatus.create({
        data: {
          isConnected: status.isConnected,
          lastCheck: status.lastCheck,
          errorMessage: status.errorMessage
            ? `[${instanceLabel}] ${status.errorMessage}`
            : undefined,
          instanceStatus: status.instanceStatus,
        },
      });
      console.log(`💾 Status saved to database (${instanceLabel})`);
    } catch (error) {
      console.error('❌ Failed to save status to database:', error);
      console.log(
        'ℹ️  Note: Run "npx prisma db push" to add WebhookStatus table'
      );
    }
  }

  async monitor(): Promise<void> {
    console.log('🚀 Starting Webhook Status Monitor...');
    console.log(`📱 Notifications enabled: ${this.notificationsEnabled}`);

    const telegramNotifier = getTelegramNotifier();
    if (telegramNotifier.isConfigured()) {
      console.log('✅ Telegram notifications configured');
    } else {
      console.log('⚠️ Telegram notifications not configured');
      console.log(
        '   Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_IDS (comma-separated list) in .env'
      );
    }

    const checks: Array<{
      instanceId: string;
      token: string;
      role: InstanceRole;
      label: string;
      logLabel: string;
    }> = [];

    if (env.GREEN_API_INSTANCE_ID && env.GREEN_API_TOKEN) {
      checks.push({
        instanceId: env.GREEN_API_INSTANCE_ID,
        token: env.GREEN_API_TOKEN,
        role: 'product-parser',
        label: 'Product parser',
        logLabel: 'product parser (catalog)',
      });
    }

    if (env.GREEN_API_ADMIN_INSTANCE_ID && env.GREEN_API_ADMIN_TOKEN) {
      checks.push({
        instanceId: env.GREEN_API_ADMIN_INSTANCE_ID,
        token: env.GREEN_API_ADMIN_TOKEN,
        role: 'admin-chat',
        label: 'Admin chat',
        logLabel: 'admin chat',
      });
    }

    if (checks.length === 0) {
      throw new Error(
        'No Green API credentials configured. Set GREEN_API_INSTANCE_ID + GREEN_API_TOKEN (product parser) and/or GREEN_API_ADMIN_INSTANCE_ID + GREEN_API_ADMIN_TOKEN (admin chat).'
      );
    }

    const dashboardUrl = 'https://console.green-api.com/instanceList/';

    for (const c of checks) {
      console.log(`🔍 Checking Green API instance (${c.logLabel})...`);

      const status = await this.checkInstanceStatus(c.instanceId, c.token);

      await this.saveStatusToDatabase(status, c.label);

      if (!status.isConnected) {
        console.log(
          `🚨 Webhook is not OK for ${c.logLabel}: ${status.errorMessage}`
        );

        if (this.notificationsEnabled) {
          const headline = defaultHeadline(c.role);
          const details = escapeTelegramHtml(status.errorMessage || 'unknown');
          const notificationMessage =
            `${escapeTelegramHtml(headline)}\n\n` +
            `<b>Instance:</b> ${escapeTelegramHtml(c.label)}\n` +
            `<b>Details:</b> ${details}\n` +
            `<b>Time:</b> ${escapeTelegramHtml(status.lastCheck.toISOString())}\n\n` +
            `<a href="${dashboardUrl}">Open Green API console</a>`;

          await this.sendNotification(notificationMessage);
        }
      } else {
        console.log(`✅ Webhook OK (${c.logLabel})`);
      }
    }

    console.log('🏁 Monitoring complete');
  }
}

async function main() {
  try {
    const monitor = new WebhookStatusMonitor();
    await monitor.monitor();
  } catch (error) {
    console.error('❌ Monitor failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
