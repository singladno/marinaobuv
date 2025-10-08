#!/usr/bin/env tsx

import { prisma } from '../lib/db-node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Cancel all running OpenAI batches
 */
async function cancelAllBatches() {
  console.log('🛑 Cancelling all running batches...');

  // Get all running batches from our database
  const runningBatches = await prisma.gptBatchJob.findMany({
    where: { status: 'running' },
  });

  if (runningBatches.length === 0) {
    console.log('✅ No running batches found');
    return;
  }

  console.log(`📊 Found ${runningBatches.length} running batches to cancel`);

  for (const batch of runningBatches) {
    if (!batch.batchId) {
      console.log(`⚠️  Batch ${batch.id} has no batchId, skipping`);
      continue;
    }

    try {
      console.log(`🛑 Cancelling batch ${batch.batchId}...`);

      // Cancel the batch in OpenAI
      await openai.batches.cancel(batch.batchId);

      // Update our database
      await prisma.gptBatchJob.update({
        where: { id: batch.id },
        data: { status: 'cancelled' },
      });

      console.log(`✅ Cancelled batch ${batch.batchId}`);
    } catch (error) {
      console.error(`❌ Error cancelling batch ${batch.batchId}:`, error);
    }
  }

  console.log('✅ Batch cancellation completed');
}

async function main() {
  try {
    await cancelAllBatches();
  } catch (error) {
    console.error('❌ Error cancelling batches:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
