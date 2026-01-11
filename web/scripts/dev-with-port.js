#!/usr/bin/env node

import { createServer } from 'net';
import { spawn } from 'child_process';

function checkPort(port) {
  return new Promise(resolve => {
    const server = createServer();
    server.once('error', err => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findAvailablePort() {
  const port3000Available = await checkPort(3000);
  if (port3000Available) {
    return 3000;
  }
  console.log('Port 3000 is in use, using port 3001 instead');
  return 3001;
}

async function startDev() {
  const port = await findAvailablePort();
  const env = { ...process.env, PORT: port.toString() };

  const nextProcess = spawn('next', ['dev', '--turbopack', '-H', '0.0.0.0'], {
    env,
    stdio: 'inherit',
    shell: true,
  });

  nextProcess.on('error', error => {
    console.error('Failed to start Next.js:', error);
    process.exit(1);
  });

  nextProcess.on('exit', code => {
    process.exit(code || 0);
  });
}

startDev();
