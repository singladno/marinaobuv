import { fetchExtendedBatch } from '../lib/utils/batch-extender';
import { env } from '../lib/env';

/**
 * Test script to verify extended batch logic
 */
async function testExtendedBatch() {
  console.log('🧪 Testing Extended Batch Logic...\n');

  try {
    const batchSize = env.PROCESSING_BATCH_SIZE;
    console.log(`📊 Testing with batch size: ${batchSize}`);
    console.log(`🎯 Target group ID: ${env.TARGET_GROUP_ID || 'all groups'}\n`);

    const result = await fetchExtendedBatch(batchSize, env.TARGET_GROUP_ID);

    console.log('📈 Results:');
    console.log(`   Original batch size: ${result.originalBatchSize}`);
    console.log(`   Total messages: ${result.totalCount}`);
    console.log(`   Extended by: ${result.extendedCount} messages`);
    console.log(
      `   Extension ratio: ${result.extendedCount > 0 ? ((result.extendedCount / result.originalBatchSize) * 100).toFixed(1) : 0}%`
    );

    if (result.totalCount > 0) {
      console.log('\n✅ Extended batch logic is working correctly!');
      console.log(`   Found ${result.totalCount} messages to process`);
      if (result.extendedCount > 0) {
        console.log(
          `   Successfully extended batch by ${result.extendedCount} consecutive messages`
        );
      } else {
        console.log('   No consecutive messages found to extend batch');
      }
    } else {
      console.log('\n⚠️  No unprocessed messages found');
    }
  } catch (error) {
    console.error('❌ Error testing extended batch logic:', error);
    throw error;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testExtendedBatch()
    .then(() => {
      console.log('\n🎉 Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testExtendedBatch };
