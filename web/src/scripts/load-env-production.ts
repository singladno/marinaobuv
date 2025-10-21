// Load environment variables from .env.production for production use
import dotenv from 'dotenv';
import { resolve } from 'path';

// Force .env.production values to override any pre-set shell variables
dotenv.config({ path: resolve('.env.production'), override: true });
