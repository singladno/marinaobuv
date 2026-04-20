#!/usr/bin/env node
/**
 * Ensures `.next/prerender-manifest.json` exists after `next build`.
 * Next.js `next start` opens this file at startup; if the build output is
 * incomplete or an edge case omits it, PM2 crashes with ENOENT.
 *
 * Safe to run when the file already exists (no-op).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');
const distDir = process.env.NEXT_DIST_DIR || '.next';
const nextDir = path.join(webRoot, distDir);
const manifestPath = path.join(nextDir, 'prerender-manifest.json');
const buildIdPath = path.join(nextDir, 'BUILD_ID');

if (fs.existsSync(manifestPath)) {
  process.exit(0);
}

if (!fs.existsSync(buildIdPath)) {
  console.error(
    `ensure-prerender-manifest: ${distDir}/BUILD_ID missing — next build did not complete successfully`
  );
  process.exit(1);
}

fs.mkdirSync(nextDir, { recursive: true });

/** Minimal shape accepted by Next 15 production server */
const minimal = {
  version: 4,
  routes: {},
  dynamicRoutes: {},
  notFoundRoutes: [],
  preview: {
    previewModeId: 'development-id',
    previewModeSigningKey: '',
    previewModeEncryptionKey: '',
  },
};

fs.writeFileSync(manifestPath, JSON.stringify(minimal));
console.warn(
  'ensure-prerender-manifest: wrote minimal prerender-manifest.json (build did not emit one)'
);
