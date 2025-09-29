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

    // Step 2: Process each group
    for (let i = 0; i < messageGroups.length; i++) {
      const group = messageGroups[i];
      await this.groupProcessor.processGroup(
        group,
        i + 1,
        messageGroups.length
      );
    }

    console.log(
      `\n🎉 Processing complete! Processed ${messageGroups.length} product groups.`
    );
  }
}
