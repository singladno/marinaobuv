import type { MessageGroup } from '../gpt-grouping';

import { BatchProcessor } from './BatchProcessor';

export class MessageGrouper {
  private batchProcessor: BatchProcessor;

  constructor() {
    this.batchProcessor = new BatchProcessor();
  }

  /**
   * Group messages using GPT analysis
   */
  async groupMessagesWithGPT(messageIds: string[]): Promise<MessageGroup[]> {
    console.log(
      `Analyzing ${messageIds.length} messages with GPT for intelligent grouping...`
    );

    // Process messages in batches to avoid OpenAI rate limits (configurable via env)
    const batchSize = 150; // Reduced to avoid token limits
    const allGroups: MessageGroup[] = [];
    let groupCounter = 0;

    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batchMessageIds = messageIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(messageIds.length / batchSize);

      console.log(
        `\n🔄 Processing batch ${batchNumber}/${totalBatches}: ${batchMessageIds.length} messages`
      );
      console.log(
        `   Messages ${i + 1}-${Math.min(i + batchSize, messageIds.length)} of ${messageIds.length}`
      );

      const batchGroups = await this.batchProcessor.processBatch(
        batchMessageIds,
        groupCounter
      );
      allGroups.push(...batchGroups);
      groupCounter += batchGroups.length;

      console.log(
        `✅ Batch ${batchNumber} complete: ${batchGroups.length} groups created`
      );
      console.log(`   Total groups so far: ${allGroups.length}`);

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < messageIds.length) {
        console.log(`⏳ Waiting 1 second before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `GPT analysis complete. Created ${allGroups.length} groups from ${messageIds.length} messages`
    );
    return allGroups;
  }
}
