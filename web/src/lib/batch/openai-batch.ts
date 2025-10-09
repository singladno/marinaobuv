import OpenAI from 'openai';
import fs from 'node:fs';
import { prisma } from '../db-node';
import { withRetry } from '../../utils/retry';

export async function submitBatchFromLines(
  lines: string,
  type: 'grouping' | 'analysis' | 'colors'
) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const path = `/tmp/${type}-requests-${Date.now()}.jsonl`;

  // Ensure proper JSONL format - each line should be a valid JSON object
  console.log(
    `📝 Preparing ${type} batch with ${lines.split('\n').length} lines`
  );

  const jsonlContent = lines
    .trim()
    .split('\n')
    .map((line, index) => {
      try {
        // Validate that each line is valid JSON
        const parsed = JSON.parse(line);
        console.log(
          `✅ Line ${index + 1}: ${parsed.custom_id} (${parsed.method} ${parsed.url})`
        );
        return line;
      } catch (error) {
        console.error(
          `❌ Invalid JSON line ${index + 1}: ${line.substring(0, 100)}...`
        );
        console.error(`Error: ${error}`);
        throw new Error(`Invalid JSON in batch request: ${line}`);
      }
    })
    .join('\n');

  await fs.promises.writeFile(path, jsonlContent);
  console.log(`📁 Batch file created: ${path}`);

  const file = await withRetry(() =>
    openai.files.create({ file: fs.createReadStream(path), purpose: 'batch' })
  );
  console.log(`📤 Batch file uploaded to OpenAI: ${(file as any).id}`);
  const batch = await withRetry(() =>
    openai.batches.create({
      input_file_id: (file as any).id,
      endpoint: '/v1/chat/completions',
      completion_window: '24h', // OpenAI only supports 24h
      metadata: { type },
    })
  );
  console.log(`🚀 Batch job created: ${(batch as any).id}`);

  await prisma.gptBatchJob.create({
    data: {
      type,
      status: 'running',
      batchId: (batch as any).id,
      inputFileId: (file as any).id,
    },
  });
  return (batch as any).id as string;
}

export async function pollBatch(batchId: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const batch = await withRetry(() => openai.batches.retrieve(batchId));
  return batch as any;
}

export async function downloadBatchResults(
  outputFileId: string
): Promise<string> {
  if (!outputFileId || outputFileId === 'null') {
    throw new Error(`Invalid output file ID: ${outputFileId}`);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  try {
    const res = await withRetry(() => openai.files.content(outputFileId));
    const buf = Buffer.from(await (res as any).arrayBuffer());
    const out = `/tmp/batch-results-${outputFileId}.jsonl`;
    await fs.promises.writeFile(out, buf);
    return out;
  } catch (error) {
    console.error(
      `Failed to download batch results for file ID: ${outputFileId}`
    );
    throw error;
  }
}
