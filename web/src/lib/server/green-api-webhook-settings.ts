import { getGreenApiIncomingWebhookUrl } from '@/lib/server/green-webhook-relay';

/** Body for Green API `setSettings` — keep in sync with dashboard toggles. */
export function buildGreenApiWebhookSettingsPayload(): Record<string, string> {
  return {
    webhookUrl: getGreenApiIncomingWebhookUrl(),
    incomingWebhook: 'yes',
    outgoingWebhook: 'yes',
    stateWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    outgoingAPIMessageWebhook: 'yes',
    outgoingMessageStatusWebhook: 'yes',
    pollMessageWebhook: 'yes',
    incomingCallWebhook: 'yes',
    editedMessageWebhook: 'yes',
    deletedMessageWebhook: 'yes',
  };
}

export async function applyGreenApiWebhookSettings(params: {
  instanceId: string;
  token: string;
  baseUrl?: string;
}): Promise<{ saveSettings?: boolean; [key: string]: unknown }> {
  const base = (params.baseUrl || 'https://api.green-api.com').replace(
    /\/$/,
    ''
  );
  const url = `${base}/waInstance${params.instanceId}/setSettings/${params.token}`;
  const body = JSON.stringify(buildGreenApiWebhookSettingsPayload());
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  return (await response.json()) as {
    saveSettings?: boolean;
    [key: string]: unknown;
  };
}
