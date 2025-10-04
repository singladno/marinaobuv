// Load environment variables from appropriate .env file
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Determine which .env file to use
let envFile = '.env.local'; // default

// Check for explicit path override first
if (process.env.DOTENV_CONFIG_PATH) {
  envFile = process.env.DOTENV_CONFIG_PATH;
} else if (process.env.NODE_ENV === 'production') {
  if (existsSync('.env.production')) {
    envFile = '.env.production';
  } else if (existsSync('.env.local')) {
    envFile = '.env.local';
  }
} else {
  // For development, prefer .env.local
  if (existsSync('.env.local')) {
    envFile = '.env.local';
  }
}

// Force .env values to override any pre-set shell variables
dotenv.config({ path: resolve(envFile), override: true });
