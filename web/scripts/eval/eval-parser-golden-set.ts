#!/usr/bin/env tsx

/**
 * Dry-run regression eval for WhatsApp / Telegram product parsers.
 *
 * Replays golden-set snapshots through the same Groq prompts as production.
 * Does not create or activate catalog products.
 *
 *   npx tsx scripts/eval/eval-parser-golden-set.ts --check
 *   npx tsx scripts/eval/eval-parser-golden-set.ts
 *   npx tsx scripts/eval/eval-parser-golden-set.ts --id price-pack-mismatch
 */

import '../../src/scripts/load-env';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Groq from 'groq-sdk';
import { getGroqConfig } from '../../src/lib/groq-proxy-config';
import { groqChatCompletion } from '../../src/lib/services/groq-api-wrapper';
import {
  PRICE_EXTRACTION_SYSTEM_PROMPT,
  PRICE_EXTRACTION_USER_PROMPT,
} from '../../src/lib/prompts/price-extraction-prompts';
import {
  GENDER_EXTRACTION_SYSTEM_PROMPT,
  GENDER_EXTRACTION_USER_PROMPT,
} from '../../src/lib/prompts/gender-extraction-prompts';
import {
  generateSizesExtractionSystemPrompt,
  generateSizesExtractionUserPrompt,
} from '../../src/lib/prompts/sizes-extraction-prompts';
import {
  TEXT_ANALYSIS_SYSTEM_PROMPT,
  TEXT_ANALYSIS_USER_PROMPT,
} from '../../src/lib/prompts/text-analysis-prompts';
import { normalizeSizeLabel } from '../../src/lib/utils/size-label';
import { ensureMulticolorPackDescription } from '../../src/lib/utils/multicolor-pack-copy';
import { mapSeason } from '../../src/lib/services/product-creation-mappers';

const GOLDEN_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'parser-golden-set.json'
);
const RETIRED_TEXT_MODELS = new Set(['llama-3.3-70b-versatile']);
const PROD_TEXT_MODEL = 'openai/gpt-oss-120b';

function resolveTextModel(): string {
  const raw = process.env.GROQ_TEXT_MODEL || 'openai/gpt-oss-20b';
  if (RETIRED_TEXT_MODELS.has(raw)) {
    console.warn(
      `GROQ_TEXT_MODEL=${raw} is retired; using ${PROD_TEXT_MODEL} (prod)`
    );
    return PROD_TEXT_MODEL;
  }
  return raw;
}

const MODEL = resolveTextModel();
const GROQ_RETRY = {
  maxRetries: 5,
  baseDelayMs: 2000,
  maxDelayMs: 60000,
  timeoutMs: 120000,
} as const;

type Pipeline = 'wa' | 'tg';
type TelegramProfile = 'flowers' | 'cosmetics' | 'household';
type Gender = 'MALE' | 'FEMALE';

type SizeRow = { size: string; count: number };

type Expected = {
  price?: number;
  gender?: Gender | null;
  sizes?: SizeRow[];
  packPairs?: number;
  name?: string;
  season?: string | null;
  unitPrice?: number;
  descriptionIncludes?: string[];
  multicolorPack?: boolean;
};

type GoldenCase = {
  id: string;
  active: boolean;
  pipeline: Pipeline;
  tags?: string[];
  notes?: string;
  source?: {
    maxChat?: string;
    maxMessageId?: string | number;
    productId?: string;
    productSlug?: string;
    waMessageIds?: string[];
    tgMessageIds?: string[];
    telegramProfile?: TelegramProfile;
  };
  input: {
    text?: string;
    imageUrls?: string[];
  };
  expected: Expected;
};

type GoldenFile = {
  version: number;
  maxActive: number;
  cases: GoldenCase[];
};

type Actual = Record<string, unknown>;

function parseArgs(argv: string[]) {
  let checkOnly = false;
  let onlyId: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') checkOnly = true;
    else if (argv[i] === '--id' && argv[i + 1]) onlyId = argv[++i];
  }
  return { checkOnly, onlyId };
}

function loadGolden(): GoldenFile {
  const raw = fs.readFileSync(GOLDEN_PATH, 'utf8');
  const data = JSON.parse(raw) as GoldenFile;
  if (!Array.isArray(data.cases)) {
    throw new Error('parser-golden-set.json: cases must be an array');
  }
  return data;
}

function validateGolden(
  file: GoldenFile,
  opts: { requireText?: boolean } = {}
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const maxActive = file.maxActive ?? 20;
  const active = file.cases.filter(c => c.active);
  if (active.length > maxActive) {
    errors.push(
      `Too many active cases: ${active.length} (max ${maxActive}). Disable some to avoid extra LLM spend.`
    );
  }
  for (const c of file.cases) {
    if (!c.id) errors.push('Case is missing id');
    else if (ids.has(c.id)) errors.push(`Duplicate id: ${c.id}`);
    else ids.add(c.id);
    if (c.pipeline !== 'wa' && c.pipeline !== 'tg') {
      errors.push(`${c.id}: pipeline must be "wa" or "tg"`);
    }
    if (!c.expected || Object.keys(c.expected).length === 0) {
      errors.push(`${c.id}: expected must have at least one field`);
    }
    if (opts.requireText && c.active && !c.input?.text?.trim()) {
      errors.push(
        `${c.id}: active case has no input.text — run eval:snapshot against prod first`
      );
    }
  }
  return errors;
}

function normalizeSizes(sizes: SizeRow[] | undefined): SizeRow[] {
  if (!sizes) return [];
  return [...sizes]
    .map(s => ({
      size: normalizeSizeLabel(String(s.size)),
      count: Number(s.count),
    }))
    .sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }));
}

function valuesEqual(expected: unknown, actual: unknown): boolean {
  if (Array.isArray(expected)) {
    return JSON.stringify(expected) === JSON.stringify(actual);
  }
  if (typeof expected === 'string' && typeof actual === 'string') {
    return expected.trim().toLowerCase() === actual.trim().toLowerCase();
  }
  if (typeof expected === 'number' && typeof actual === 'number') {
    return expected === actual;
  }
  return expected === actual;
}

async function groqJson(
  groq: Groq,
  operationId: string,
  system: string,
  user: string,
  temperature: number,
  maxTokens: number
): Promise<Record<string, unknown>> {
  const response = await groqChatCompletion(
    groq,
    {
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    },
    operationId,
    GROQ_RETRY
  );
  if (!('choices' in response)) {
    throw new Error(`Unexpected Groq response for ${operationId}`);
  }
  return JSON.parse(response.choices[0].message.content || '{}');
}

function readSnapshot(c: GoldenCase): { text: string; imageUrls: string[] } {
  const text = c.input.text?.trim() ?? '';
  if (!text) {
    throw new Error(
      `${c.id}: no input.text — run eval:snapshot against prod first`
    );
  }
  return { text, imageUrls: c.input.imageUrls ?? [] };
}

async function runWa(
  groq: Groq,
  c: GoldenCase,
  text: string,
  imageCount: number
) {
  const actual: Actual = {};
  const exp = c.expected;

  if ('price' in exp) {
    const result = await groqJson(
      groq,
      `eval-price-${c.id}`,
      PRICE_EXTRACTION_SYSTEM_PROMPT,
      PRICE_EXTRACTION_USER_PROMPT(text),
      0,
      500
    );
    actual.price = typeof result.price === 'number' ? result.price : null;
  }

  if ('gender' in exp) {
    const result = await groqJson(
      groq,
      `eval-gender-${c.id}`,
      GENDER_EXTRACTION_SYSTEM_PROMPT,
      GENDER_EXTRACTION_USER_PROMPT(text),
      0.2,
      500
    );
    actual.gender =
      result.gender === 'MALE' || result.gender === 'FEMALE'
        ? result.gender
        : null;
  }

  if ('sizes' in exp || 'packPairs' in exp) {
    const result = await groqJson(
      groq,
      `eval-sizes-${c.id}`,
      generateSizesExtractionSystemPrompt(),
      generateSizesExtractionUserPrompt(text),
      0.3,
      1000
    );
    const sizes = normalizeSizes(result.sizes as SizeRow[] | undefined);
    actual.sizes = sizes;
    const sum = sizes.reduce(
      (acc, s) => acc + (Number.isFinite(s.count) ? s.count : 0),
      0
    );
    actual.packPairs = sum;
  }

  if (
    'name' in exp ||
    'season' in exp ||
    'descriptionIncludes' in exp ||
    'multicolorPack' in exp
  ) {
    const result = await groqJson(
      groq,
      `eval-text-${c.id}`,
      TEXT_ANALYSIS_SYSTEM_PROMPT,
      TEXT_ANALYSIS_USER_PROMPT(text, imageCount),
      0.3,
      2500
    );
    if ('name' in exp) actual.name = result.name ?? null;
    if ('season' in exp) {
      const raw = result.season;
      actual.season =
        typeof raw === 'string' && raw.trim() ? mapSeason(raw) : null;
    }
    const mixed = result.multicolorPack === true;
    if ('multicolorPack' in exp) actual.multicolorPack = mixed;
    if ('descriptionIncludes' in exp) {
      actual.description = ensureMulticolorPackDescription(
        String(result.description ?? ''),
        mixed
      );
    }
  }

  return actual;
}

async function runTg(
  groq: Groq,
  c: GoldenCase,
  text: string,
  imageCount: number
) {
  const profile: TelegramProfile = c.source?.telegramProfile ?? 'flowers';
  let system: string;
  let user: string;

  if (profile === 'cosmetics') {
    const mod =
      await import('../../src/lib/prompts/telegram-cosmetics-analysis-prompts');
    system = mod.TELEGRAM_COSMETICS_ANALYSIS_SYSTEM_PROMPT;
    user = mod.TELEGRAM_COSMETICS_ANALYSIS_USER_PROMPT(text, imageCount);
  } else if (profile === 'household') {
    const mod =
      await import('../../src/lib/prompts/telegram-household-analysis-prompts');
    system = mod.TELEGRAM_HOUSEHOLD_ANALYSIS_SYSTEM_PROMPT;
    user = mod.TELEGRAM_HOUSEHOLD_ANALYSIS_USER_PROMPT(text, imageCount);
  } else {
    const mod =
      await import('../../src/lib/prompts/telegram-flower-analysis-prompts');
    system = mod.TELEGRAM_FLOWER_ANALYSIS_SYSTEM_PROMPT;
    user = mod.TELEGRAM_FLOWER_ANALYSIS_USER_PROMPT(text, imageCount);
  }

  const result = await groqJson(
    groq,
    `eval-tg-${c.id}`,
    system,
    user,
    0.3,
    2500
  );
  const actual: Actual = {};
  if ('name' in c.expected) actual.name = result.name ?? null;
  if ('unitPrice' in c.expected) actual.unitPrice = result.unitPrice ?? null;
  if ('price' in c.expected) actual.price = result.unitPrice ?? null;
  if ('sizes' in c.expected) {
    actual.sizes = normalizeSizes(result.sizes as SizeRow[] | undefined);
  }
  return actual;
}

function compare(c: GoldenCase, actual: Actual) {
  const diffs: string[] = [];
  for (const [key, expected] of Object.entries(c.expected)) {
    if (key === 'descriptionIncludes') {
      const desc = String(actual.description ?? '').toLowerCase();
      const missing = (expected as string[]).filter(
        needle => !desc.includes(needle.toLowerCase())
      );
      if (missing.length) {
        diffs.push(
          `  descriptionIncludes: missing ${JSON.stringify(missing)} in ${JSON.stringify(actual.description)}`
        );
      }
      continue;
    }
    const want =
      key === 'sizes' ? normalizeSizes(expected as SizeRow[]) : expected;
    const got =
      key === 'sizes' ? normalizeSizes(actual[key] as SizeRow[]) : actual[key];
    if (!valuesEqual(want, got)) {
      diffs.push(
        `  ${key}: expected ${JSON.stringify(want)} got ${JSON.stringify(got)}`
      );
    }
  }
  return diffs;
}

async function main() {
  const { checkOnly, onlyId } = parseArgs(process.argv.slice(2));
  const file = loadGolden();
  const errors = validateGolden(file, { requireText: !checkOnly });
  if (errors.length) {
    for (const e of errors) console.error(`✗ ${e}`);
    process.exit(1);
  }

  let cases = file.cases.filter(c => c.active);
  if (onlyId) {
    const wanted = onlyId
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const found = wanted.map(id => file.cases.find(c => c.id === id));
    const missing = wanted.filter((id, i) => !found[i]);
    if (missing.length) {
      console.error(`Case not found: ${missing.join(', ')}`);
      process.exit(1);
    }
    cases = found as GoldenCase[];
  }

  console.log(
    `Golden set: ${file.cases.length} total, ${file.cases.filter(c => c.active).length} active (max ${file.maxActive ?? 20})`
  );
  if (!checkOnly) {
    console.log(`Model: ${MODEL}`);
  }

  if (checkOnly) {
    const missing = file.cases.filter(c => c.active && !c.input?.text?.trim());
    if (missing.length) {
      console.log(
        `JSON OK, ${missing.length} active case(s) still need eval:snapshot`
      );
    } else {
      console.log('JSON OK');
    }
    return;
  }

  if (cases.length === 0) {
    console.log('No active cases. Add snapshots to parser-golden-set.json.');
    return;
  }

  const groq = new Groq(await getGroqConfig());
  let failed = 0;

  for (const c of cases) {
    process.stdout.write(`→ ${c.id} (${c.pipeline})... `);
    try {
      const { text, imageUrls } = readSnapshot(c);
      if (!text.trim()) {
        throw new Error('empty input text');
      }
      const actual =
        c.pipeline === 'tg'
          ? await runTg(groq, c, text, imageUrls.length)
          : await runWa(groq, c, text, imageUrls.length);
      const diffs = compare(c, actual);
      if (diffs.length) {
        failed += 1;
        console.log('FAIL');
        console.log(diffs.join('\n'));
      } else {
        console.log('PASS');
      }
    } catch (error) {
      failed += 1;
      console.log('ERROR');
      console.error(error instanceof Error ? error.message : error);
    }
  }

  console.log(
    failed === 0
      ? `\nAll ${cases.length} case(s) passed.`
      : `\n${failed}/${cases.length} case(s) failed.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
