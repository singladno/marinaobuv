#!/usr/bin/env node
import crypto from 'crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run make-hash "your-password"');
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);
process.stdout.write(`${salt.toString('hex')}:${hash.toString('hex')}`);
