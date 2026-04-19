-- GreenApiWebhookRelayConfig: optional secondary URL for /api/webhooks/green-api/relay
-- IF NOT EXISTS: safe if the table was created earlier via `prisma db push` (same shape).

CREATE TABLE IF NOT EXISTS "GreenApiWebhookRelayConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "secondaryUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GreenApiWebhookRelayConfig_pkey" PRIMARY KEY ("id")
);
