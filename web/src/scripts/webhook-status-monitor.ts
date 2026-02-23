#!/usr/bin/env tsx

/**
 * Webhook Status Monitor
 * Checks Green API instance status and sends notifications when disconnected
 */

import './load-env';
import { env } from '../lib/env';
import { prisma } from '../lib/db-node';
import { getTelegramNotifier } from '../lib/utils/telegram-notifier';

interface WebhookStatus {
  isConnected: boolean;
  lastCheck: Date;
  errorMessage?: string;
  instanceStatus?: string;
}

interface NotificationConfig {
  message: string;
  enabled: boolean;
}

export class WebhookStatusMonitor {
  private instanceId: string;
  private token: string;
  private baseUrl: string;
  private notificationConfig: NotificationConfig;

  constructor() {
    if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
      throw new Error('Green API credentials not configured!');
    }

    this.instanceId = env.GREEN_API_INSTANCE_ID;
    this.token = env.GREEN_API_TOKEN;
    this.baseUrl = env.GREEN_API_BASE_URL || 'https://api.green-api.com';

    // Telegram notification configuration
    this.notificationConfig = {
      message:
        env.WEBHOOK_NOTIFICATION_MESSAGE ||
        '⚠️ Webhook Alert: Green API instance is disconnected. Please check the connection.',
      enabled: env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
    };
  }

  /**
   * Check Green API instance status
   */
  async checkInstanceStatus(): Promise<WebhookStatus> {
    try {
      console.log('🔍 Checking Green API instance status...');

      // Check instance state
      const stateResponse = await fetch(
        `${this.baseUrl}/waInstance${this.instanceId}/getStateInstance/${this.token}`,
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
      console.log('📊 Instance state:', stateData);

      // Check if instance is authorized and connected
      const isConnected = stateData.stateInstance === 'authorized';
      const instanceStatus = stateData.stateInstance;

      if (!isConnected) {
        console.log('❌ Instance is not connected. State:', instanceStatus);
        return {
          isConnected: false,
          lastCheck: new Date(),
          errorMessage: `Instance state: ${instanceStatus}`,
          instanceStatus,
        };
      }

      // Additional check: verify webhook settings
      const settingsResponse = await fetch(
        `${this.baseUrl}/waInstance${this.instanceId}/getSettings/${this.token}`,
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
      console.log('⚙️ Webhook settings:', settingsData);

      // Check if incoming webhook is enabled (first check - most important)
      if (settingsData.incomingWebhook !== 'yes') {
        console.log('⚠️ Incoming webhook is not enabled');
        return {
          isConnected: false,
          lastCheck: new Date(),
          errorMessage:
            'Incoming webhook is not enabled - messages will not be received',
          instanceStatus,
        };
      }

      // Check if webhook URL is properly configured
      const webhookUrl = settingsData.webhookUrl;
      const expectedWebhookUrl =
        'https://www.marina-obuv.ru/api/webhooks/green-api';

      if (!webhookUrl || webhookUrl !== expectedWebhookUrl) {
        console.log('⚠️ Webhook URL mismatch or not configured');
        return {
          isConnected: false,
          lastCheck: new Date(),
          errorMessage: `Webhook URL mismatch. Expected: ${expectedWebhookUrl}, Got: ${webhookUrl || 'not set'}`,
          instanceStatus,
        };
      }

      console.log(
        '✅ Instance is connected and webhook is properly configured'
      );
      return {
        isConnected: true,
        lastCheck: new Date(),
        instanceStatus,
      };
    } catch (error) {
      console.error('❌ Error checking instance status:', error);
      return {
        isConnected: false,
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send notification via Telegram
   */
  async sendNotification(message: string): Promise<void> {
    if (!this.notificationConfig.enabled) {
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

  /**
   * Save status to database for tracking
   */
  async saveStatusToDatabase(status: WebhookStatus): Promise<void> {
    try {
      // Note: This requires the WebhookStatus model to be added to the database
      // Run: npx prisma db push or npx prisma migrate dev
      await (prisma as any).webhookStatus.create({
        data: {
          isConnected: status.isConnected,
          lastCheck: status.lastCheck,
          errorMessage: status.errorMessage,
          instanceStatus: status.instanceStatus,
        },
      });
      console.log('💾 Status saved to database');
    } catch (error) {
      console.error('❌ Failed to save status to database:', error);
      console.log(
        'ℹ️  Note: Run "npx prisma db push" to add WebhookStatus table'
      );
    }
  }

  /**
   * Main monitoring function
   */
  async monitor(): Promise<void> {
    console.log('🚀 Starting Webhook Status Monitor...');
    console.log(`📱 Notifications enabled: ${this.notificationConfig.enabled}`);

    const telegramNotifier = getTelegramNotifier();
    if (telegramNotifier.isConfigured()) {
      console.log('✅ Telegram notifications configured');
    } else {
      console.log('⚠️ Telegram notifications not configured');
      console.log(
        '   Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_IDS (comma-separated list) in .env'
      );
    }

    const status = await this.checkInstanceStatus();

    // Save status to database
    await this.saveStatusToDatabase(status);

    if (!status.isConnected) {
      console.log('🚨 Webhook is not working properly!');
      console.log(`❌ Error: ${status.errorMessage}`);

      // Send Telegram notification if enabled
      if (this.notificationConfig.enabled) {
        const notificationMessage = `${this.notificationConfig.message}\n\nDetails: ${status.errorMessage}\nTime: ${status.lastCheck.toISOString()}`;
        await this.sendNotification(notificationMessage);
      }
    } else {
      console.log('✅ Webhook is working properly');
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
