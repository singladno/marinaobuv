// Load environment variables from .env file
import dotenv from 'dotenv';
import { resolve } from 'path';

// Always use .env file
dotenv.config({ path: resolve('.env'), override: true });
