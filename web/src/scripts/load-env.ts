// Load environment variables from .env.local
import dotenv from 'dotenv';
// Force .env.local values to override any pre-set shell variables
dotenv.config({ path: '.env.local', override: true });
