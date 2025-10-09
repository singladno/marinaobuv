#!/usr/bin/env tsx

import { BatchRetryService } from '../lib/services/batch-retry-service';

/**
 * Script to resubmit all failed batches
 */
async function main() {
  console.log('🔄 Starting batch retry process...');

  const retryService = new BatchRetryService();
  
  try {
    const resubmittedCount = await retryService.resubmitAllFailedBatches();
    
    if (resubmittedCount > 0) {
      console.log(`🎉 Successfully resubmitted ${resubmittedCount} failed batches`);
    } else {
      console.log('✅ No failed batches found to resubmit');
    }
  } catch (error) {
    console.error('❌ Error during batch retry:', error);
    process.exit(1);
  }
}

main().catch(console.error);
