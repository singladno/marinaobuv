-- AlterTable: Change tgMessageId from INTEGER to BIGINT
ALTER TABLE "TelegramMessage"
  ALTER COLUMN "tgMessageId" TYPE BIGINT USING "tgMessageId"::BIGINT;

-- AlterTable: Change fromId from INTEGER to BIGINT
ALTER TABLE "TelegramMessage"
  ALTER COLUMN "fromId" TYPE BIGINT USING "fromId"::BIGINT;

-- AlterTable: Change telegramId in Provider from INTEGER to BIGINT
ALTER TABLE "Provider"
  ALTER COLUMN "telegramId" TYPE BIGINT USING "telegramId"::BIGINT;
