#!/usr/bin/env tsx

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Cancel all running OpenAI batches directly from OpenAI API
 */
async function cancelAllOpenAIBatches() {
  console.log('🛑 Cancelling all running OpenAI batches...');

  try {
    // List all batches from OpenAI
    const batches = await openai.batches.list();
    
    console.log(`📊 Found ${batches.data.length} total batches`);
    
    const runningBatches = batches.data.filter(batch => 
      batch.status === 'in_progress' || batch.status === 'validating'
    );
    
    if (runningBatches.length === 0) {
      console.log('✅ No running batches found on OpenAI');
      return;
    }

    console.log(`📊 Found ${runningBatches.length} running batches to cancel`);

    for (const batch of runningBatches) {
      try {
        console.log(`🛑 Cancelling batch ${batch.id} (status: ${batch.status})...`);
        
        // Cancel the batch in OpenAI
        await openai.batches.cancel(batch.id);
        
        console.log(`✅ Cancelled batch ${batch.id}`);
      } catch (error) {
        console.error(`❌ Error cancelling batch ${batch.id}:`, error);
      }
    }

    console.log('✅ Batch cancellation completed');
  } catch (error) {
    console.error('❌ Error listing batches:', error);
  }
}

async function main() {
  try {
    await cancelAllOpenAIBatches();
  } catch (error) {
    console.error('❌ Error cancelling batches:', error);
    process.exit(1);
  }
}

main();
