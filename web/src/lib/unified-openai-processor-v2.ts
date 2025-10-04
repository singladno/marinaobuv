import { GroupProcessor } from './processors/GroupProcessor';
import { MessageGroupingService } from './services/message-grouping-service';

/**
 * Refactored unified OpenAI processor with clean separation of concerns
 */
export class UnifiedOpenAIProcessor {
  private groupingService: MessageGroupingService;
  private groupProcessor: GroupProcessor;

  constructor() {
    this.groupingService = new MessageGroupingService();
    this.groupProcessor = new GroupProcessor();
  }

  /**
   * Main processing function - clean and readable
   */
  async processMessagesToProducts(messageIds: string[]): Promise<void> {
    console.log(
      `🚀 Processing ${messageIds.length} messages with unified OpenAI approach...`
    );

    // Step 1: Group messages using OpenAI
    const messageGroups = await this.groupingService.groupMessages(messageIds);

    if (messageGroups.length === 0) {
      console.log(
        `⚠️  No product groups found. Messages may not contain valid product information.`
      );
      return;
    }

    console.log(
      `📊 Step 2: Processing each group with unified OpenAI analysis...`
    );

    // Step 2: Process each group with timeout protection
    for (let i = 0; i < messageGroups.length; i++) {
      const group = messageGroups[i];

      try {
        // Add timeout protection for each group processing
        await this.processGroupWithTimeout(group, i + 1, messageGroups.length);
      } catch (error) {
        console.error(
          `❌ Error processing group ${i + 1}/${messageGroups.length}:`,
          error
        );
        // Continue with next group instead of failing entirely
        continue;
      }
    }

    console.log(
      `\n🎉 Processing complete! Processed ${messageGroups.length} product groups.`
    );
  }

  /**
   * Process a single group with timeout protection
   */
  private async processGroupWithTimeout(
    group: any,
    index: number,
    total: number,
    timeoutMs: number = 10 * 60 * 1000 // 10 minutes per group
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log(
          `⏰ Group ${index}/${total} processing timed out after ${timeoutMs / 1000}s, skipping...`
        );
        resolve(); // Don't reject, just skip this group
      }, timeoutMs);

      try {
        await this.groupProcessor.processGroup(group, index, total);
        clearTimeout(timeout);
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}
