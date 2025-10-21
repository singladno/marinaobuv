// Load environment variables strictly from .env file
import dotenv from 'dotenv';
import { resolve } from 'path';
import { bootstrap } from 'global-agent';

// Always use .env file
dotenv.config({ path: resolve('.env'), override: true });

// Initialize global proxy agent if proxy is configured
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  console.log(
    '🌐 Proxy configured:',
    process.env.HTTPS_PROXY || process.env.HTTP_PROXY
  );
  bootstrap();
}
