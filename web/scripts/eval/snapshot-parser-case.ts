#!/usr/bin/env tsx

/**
 * One-time pull of supplier message text from a database into golden-set JSON.
 *
 *   EVAL_DATABASE_URL='postgresql://…prod…' npx tsx scripts/eval/snapshot-parser-case.ts
 *   npx tsx scripts/eval/snapshot-parser-case.ts --database-url "$PROD_URL" --slug product-xxx
 *
 * Does not call the LLM. Eval runs later read only the JSON file.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const GOLDEN_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'parser-golden-set.json'
);

type GoldenCase = {
  id: string;
  source?: {
    productSlug?: string;
    productId?: string;
    waMessageIds?: string[];
  };
  input: { text?: string; imageUrls?: string[] };
  [key: string]: unknown;
};

type GoldenFile = {
  version: number;
  maxActive: number;
  cases: GoldenCase[];
};

function parseArgs(argv: string[]) {
  const slugs: string[] = [];
  let databaseUrl: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug' && argv[i + 1]) slugs.push(argv[++i]);
    else if (argv[i] === '--database-url' && argv[i + 1])
      databaseUrl = argv[++i];
  }
  return {
    slugs,
    databaseUrl:
      databaseUrl ||
      process.env.EVAL_DATABASE_URL ||
      process.env.PROD_DATABASE_URL,
  };
}

function loadGolden(): GoldenFile {
  return JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8')) as GoldenFile;
}

async function snapshotSlug(
  prisma: PrismaClient,
  slug: string
): Promise<{ text: string; imageUrls: string[]; waMessageIds: string[] }> {
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) {
    throw new Error(`Product not found: ${slug}`);
  }
  const sourceIds = Array.isArray(product.sourceMessageIds)
    ? (product.sourceMessageIds as string[])
    : [];
  if (sourceIds.length === 0) {
    throw new Error(`${slug}: Product.sourceMessageIds is empty`);
  }

  if (product.source === 'TG') {
    const messages = await prisma.telegramMessage.findMany({
      where: { id: { in: sourceIds } },
      orderBy: { createdAt: 'asc' },
    });
    const text = messages
      .map(m => m.text || m.caption)
      .filter(Boolean)
      .join('\n\n');
    const imageUrls = messages.filter(m => m.mediaUrl).map(m => m.mediaUrl!);
    if (!text.trim()) {
      throw new Error(`${slug}: Telegram messages have no text`);
    }
    return { text, imageUrls, waMessageIds: [] };
  }

  const messages = await prisma.whatsAppMessage.findMany({
    where: { id: { in: sourceIds } },
    orderBy: { createdAt: 'asc' },
  });
  if (messages.length === 0) {
    throw new Error(`${slug}: no WhatsAppMessage rows for sourceMessageIds`);
  }
  const text = messages
    .map(m => m.text)
    .filter(Boolean)
    .join('\n\n');
  const imageUrls = messages
    .filter(m => m.type === 'imageMessage' && m.mediaUrl)
    .map(m => m.mediaUrl!);
  if (!text.trim()) {
    throw new Error(`${slug}: WhatsApp messages have no text`);
  }
  return { text, imageUrls, waMessageIds: messages.map(m => m.id) };
}

async function main() {
  const { slugs, databaseUrl } = parseArgs(process.argv.slice(2));
  if (!databaseUrl) {
    console.error(
      'Set EVAL_DATABASE_URL or pass --database-url (prod). Do not use local DATABASE_URL.'
    );
    process.exit(1);
  }

  const file = loadGolden();
  const targetSlugs =
    slugs.length > 0
      ? slugs
      : [
          ...new Set(
            file.cases
              .filter(c => c.source?.productSlug && !c.input?.text?.trim())
              .map(c => c.source!.productSlug!)
          ),
        ];

  if (targetSlugs.length === 0) {
    console.log(
      'Nothing to snapshot (no slugs / all cases already have text).'
    );
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    for (const slug of targetSlugs) {
      process.stdout.write(`→ ${slug}... `);
      const snap = await snapshotSlug(prisma, slug);
      const matches = file.cases.filter(c => c.source?.productSlug === slug);
      if (matches.length === 0) {
        console.log('SKIP (slug not in golden-set)');
        continue;
      }
      for (const c of matches) {
        c.input = {
          ...c.input,
          text: snap.text,
          imageUrls: snap.imageUrls,
        };
        c.source = {
          ...c.source,
          waMessageIds: snap.waMessageIds.length
            ? snap.waMessageIds
            : c.source?.waMessageIds,
        };
      }
      console.log(
        `OK (${snap.text.length} chars, ${snap.imageUrls.length} images)`
      );
    }
    fs.writeFileSync(GOLDEN_PATH, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Wrote ${GOLDEN_PATH}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
