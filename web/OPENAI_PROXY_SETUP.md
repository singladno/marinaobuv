# OpenAI Proxy Setup Guide

This guide helps you configure a proxy for OpenAI API requests to bypass region restrictions.

## Problem

The server is getting 403 "Country, region, or territory not supported" errors from OpenAI because it's located in a restricted region.

## Solution

We've implemented a centralized OpenAI client factory that supports proxy configuration.

## Quick Start

### 1. Test Current Setup

```bash
# Test if OpenAI works without proxy
tsx test-openai-proxy.ts
```

### 2. If You Get 403 Errors

You need to set up a proxy. Choose one of these options:

#### Option A: Use a Proxy Service

1. Sign up for a proxy service (Bright Data, ProxyMesh, etc.)
2. Get a proxy URL (e.g., `http://proxy-server:8080`)
3. Set the environment variable:

```bash
export OPENAI_PROXY="http://proxy-server:8080"
```

#### Option B: Use a VPN

1. Install a VPN client (NordVPN, ExpressVPN, etc.)
2. Connect to a server in a supported region (US, EU, etc.)
3. Test OpenAI API access

#### Option C: Local Proxy for Testing

```bash
# Start a simple proxy server
node simple-proxy.js

# In another terminal, test with proxy
export OPENAI_PROXY="http://localhost:8080"
tsx test-openai-proxy.ts
```

### 3. Test All Integrations

```bash
# Run comprehensive tests
tsx test-openai-complete.ts
```

## Environment Variables

Add these to your `.env.local` or server environment:

```bash
# Required
OPENAI_API_KEY=your_api_key_here

# Optional - for proxy support
OPENAI_PROXY=http://proxy-server:8080

# Optional - for rate limiting
OPENAI_REQUEST_DELAY_MS=1000
```

## Files Modified

- `src/lib/openai-client.ts` - Centralized OpenAI client factory
- `src/lib/services/unified-analysis-service.ts` - Updated to use proxy
- `src/lib/services/message-grouping-service.ts` - Updated to use proxy
- `src/lib/services/per-image-color-service.ts` - Updated to use proxy
- `src/lib/openai-vision.ts` - Updated to use proxy

## Testing Scripts

- `test-openai-proxy.ts` - Basic proxy test
- `test-proxy-config.ts` - Multiple proxy configurations
- `test-openai-complete.ts` - Complete integration test
- `setup-local-proxy.sh` - Setup instructions

## Production Deployment

1. **Set up a reliable proxy service** in a supported region
2. **Configure the proxy URL** in your server environment
3. **Test the configuration** before deploying
4. **Monitor the logs** for any proxy-related issues

## Troubleshooting

### 403 Region Restriction Error

- ✅ Set up a proxy in a supported region
- ✅ Verify the proxy is working
- ✅ Test with a simple API call

### Connection Errors

- ✅ Check proxy URL format
- ✅ Verify proxy server is running
- ✅ Test network connectivity

### Rate Limiting

- ✅ Add delays between requests
- ✅ Use `OPENAI_REQUEST_DELAY_MS` environment variable
- ✅ Implement exponential backoff

## Supported Proxy Formats

- HTTP: `http://proxy-server:8080`
- HTTPS: `https://proxy-server:8080`
- SOCKS5: `socks5://proxy-server:1080`
- With authentication: `http://user:pass@proxy-server:8080`

## Next Steps

1. Test locally with your chosen proxy
2. Deploy the configuration to your server
3. Monitor the application logs
4. Set up monitoring for proxy health
