# Telegram Parser Setup Guide

The Telegram parser can work in two modes:
1. **Bot API mode** (limited - bot must be admin in channel)
2. **MTProto mode** (recommended - uses your user account)

## MTProto Setup (Recommended)

This allows you to use your Telegram account to read messages from channels you're subscribed to.

### Step 1: Get API Credentials

1. Go to https://my.telegram.org/apps
2. Log in with your phone number
3. Create a new application
4. Copy your **API ID** and **API Hash**

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Telegram Parser
TELEGRAM_CHANNEL_ID=@your_channel_username  # e.g., @channelname (without @)

# Telegram User Account (for MTProto - direct channel access)
TELEGRAM_API_ID=your_api_id                 # From https://my.telegram.org/apps
TELEGRAM_API_HASH=your_api_hash             # From https://my.telegram.org/apps
TELEGRAM_PHONE=+1234567890                  # Your phone number with country code
TELEGRAM_SESSION_STRING=                    # Will be generated after first auth
```

### Step 3: Authenticate Your Account

Run the authentication script:

```bash
cd web
npx tsx scripts/setup-telegram-auth.ts
```

This will:
1. Connect to Telegram
2. Send you a code via Telegram
3. Ask you to enter the code
4. Generate a session string
5. Save the session string to your `.env` file

**Note:** If you have 2FA enabled, you may need to temporarily disable it or use a different account.

### Step 4: Test the Parser

Run the test script:

```bash
cd web
npx tsx scripts/test-telegram-parser.ts
```

## Bot API Setup (Alternative)

If you prefer to use a bot:

1. Create a bot via @BotFather on Telegram
2. Add the bot as an admin to your channel
3. Set only `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID` in `.env`

The parser will automatically fall back to Bot API mode if MTProto credentials are not available.

## How It Works

1. **Message Fetching**: Fetches messages from the last 24 hours
2. **Grouping**: Groups images + text messages from the same author into products
3. **Provider Extraction**: Extracts provider location from message text (e.g., "Линия 32-61/63 павильон")
4. **Product Creation**: Creates products with:
   - Source: `TG`
   - Color: `разноцветный` (always)
   - Measurement unit: `PIECES` (шт)
   - Price and amount parsed from message

## Cron Job

The parser runs every 24 hours via cron. The script is at:
`web/src/scripts/telegram-parser-cron.ts`

Add to your cron configuration:
```bash
0 0 * * * cd /path/to/web && npx tsx src/scripts/telegram-parser-cron.ts
```

## Troubleshooting

### "Channel not found"
- Make sure you're subscribed to the channel
- Check that `TELEGRAM_CHANNEL_ID` is correct (with or without @)

### "Authentication failed"
- Make sure API ID and Hash are correct
- Check that your phone number includes country code
- Try running the auth script again

### "Session expired"
- Re-run the authentication script
- Update `TELEGRAM_SESSION_STRING` in your `.env`
