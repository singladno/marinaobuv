-- Mirror WhatsApp/Green webhook media to our CDN; UI reads mediaS3Url, not ephemeral downloadUrl.
ALTER TABLE "WaAdminMessage" ADD COLUMN IF NOT EXISTS "mediaS3Url" TEXT;
