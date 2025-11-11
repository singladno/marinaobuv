/**
 * Rule-based grouping service for WhatsApp messages
 * Groups messages based on simple rules: images + texts from same sender
 * No LLM required - pure logic-based grouping
 */

import { prisma } from '../db-node';
import { MessageGroup } from './groq-grouping-service';

export interface GroupingResult {
  groups: MessageGroup[];
  groupedMessageIds: string[]; // Messages that were grouped
  skippedMessageIds: string[]; // Messages skipped in the middle (should be marked processed)
  ungroupedEndMessageIds: string[]; // Messages at the end that couldn't form groups (leave unprocessed)
}

export class RuleBasedGroupingService {
  /**
   * Group messages using rule-based logic:
   * - images + texts (same sender) = one group
   * - text + images + text = split to remove first text(s)
   * - images + texts + images + texts = split into multiple groups
   */
  async groupMessages(messages: any[]): Promise<MessageGroup[]> {
    const result = await this.groupMessagesWithTracking(messages);
    return result.groups;
  }

  /**
   * Group messages with tracking of which messages were grouped, skipped, or left ungrouped
   */
  async groupMessagesWithTracking(messages: any[]): Promise<GroupingResult> {
    if (messages.length === 0) {
      return {
        groups: [],
        groupedMessageIds: [],
        skippedMessageIds: [],
        ungroupedEndMessageIds: [],
      };
    }

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt || a.timestamp).getTime() -
        new Date(b.createdAt || b.timestamp).getTime()
    );

    // Group by sender first
    const messagesBySender = new Map<string, typeof sortedMessages>();
    for (const msg of sortedMessages) {
      const sender = msg.from || msg.senderId || 'unknown';
      if (!messagesBySender.has(sender)) {
        messagesBySender.set(sender, []);
      }
      messagesBySender.get(sender)!.push(msg);
    }

    const allGroups: MessageGroup[] = [];
    const allGroupedIds = new Set<string>();
    const allSkippedIds = new Set<string>();
    const allUngroupedEndIds = new Set<string>();

    // Process each sender's messages
    for (const [sender, senderMessages] of messagesBySender) {
      const result = this.groupMessagesBySenderWithTracking(senderMessages);
      allGroups.push(...result.groups);
      result.groupedMessageIds.forEach(id => allGroupedIds.add(id));
      result.skippedMessageIds.forEach(id => allSkippedIds.add(id));
      result.ungroupedEndMessageIds.forEach(id => allUngroupedEndIds.add(id));
    }

    return {
      groups: allGroups,
      groupedMessageIds: Array.from(allGroupedIds),
      skippedMessageIds: Array.from(allSkippedIds),
      ungroupedEndMessageIds: Array.from(allUngroupedEndIds),
    };
  }

  /**
   * Group messages from a single sender with tracking
   */
  private groupMessagesBySenderWithTracking(messages: any[]): {
    groups: MessageGroup[];
    groupedMessageIds: string[];
    skippedMessageIds: string[];
    ungroupedEndMessageIds: string[];
  } {
    if (messages.length === 0) {
      return {
        groups: [],
        groupedMessageIds: [],
        skippedMessageIds: [],
        ungroupedEndMessageIds: [],
      };
    }

    // Classify each message: 'I' for image, 'T' for text, 'N' for neither
    const messageTypes = messages.map(msg => {
      const isTextMessageType =
        msg.type === 'textMessage' || msg.type === 'extendedTextMessage';
      const hasText =
        isTextMessageType ||
        (msg.text &&
          typeof msg.text === 'string' &&
          msg.text.trim().length > 0);
      const hasImage =
        msg.mediaUrl && (msg.type === 'image' || msg.type === 'imageMessage');

      if (hasImage) return 'I';
      if (hasText) return 'T';
      return 'N';
    });

    const groups: MessageGroup[] = [];
    const groupedIds = new Set<string>();
    const skippedIds = new Set<string>();
    const ungroupedEndIds = new Set<string>();
    let i = 0;
    let lastGroupEndIndex = -1; // Track where the last group ended

    while (i < messages.length) {
      // Skip messages that are neither text nor image
      if (messageTypes[i] === 'N') {
        skippedIds.add(messages[i].id);
        i++;
        continue;
      }

      // Skip text messages that come before images
      if (messageTypes[i] === 'T') {
        skippedIds.add(messages[i].id);
        i++;
        continue;
      }

      // We found images - collect them
      if (messageTypes[i] === 'I') {
        const imageStart = i;
        const imageIndices: number[] = [];

        // Collect consecutive images
        while (i < messages.length && messageTypes[i] === 'I') {
          imageIndices.push(i);
          i++;
        }

        // After images, collect consecutive texts (within 60 seconds)
        const textIndices: number[] = [];
        const lastImageTime = new Date(
          messages[imageIndices[imageIndices.length - 1]].createdAt ||
            messages[imageIndices[imageIndices.length - 1]].timestamp
        ).getTime();

        while (i < messages.length && messageTypes[i] === 'T') {
          const textTime = new Date(
            messages[i].createdAt || messages[i].timestamp
          ).getTime();
          const timeGapSeconds = (textTime - lastImageTime) / 1000;

          // Only include text if within 60 seconds of last image
          if (timeGapSeconds <= 60) {
            textIndices.push(i);
            i++;
          } else {
            // Time gap too large - stop collecting texts
            break;
          }
        }

        // If we have images + texts, create a group
        if (imageIndices.length > 0 && textIndices.length > 0) {
          const group = this.createGroup(
            messages,
            imageStart,
            imageIndices,
            textIndices,
            groups.length
          );
          if (group) {
            groups.push(group);
            // Mark all messages in this group as grouped
            group.messageIds.forEach(id => groupedIds.add(id));
            lastGroupEndIndex = Math.max(
              ...imageIndices,
              ...textIndices
            );
            console.log(
              `  ✅ Created group ${group.groupId}: ${imageIndices.length} images + ${textIndices.length} texts`
            );
          }
        } else if (imageIndices.length > 0) {
          // Images without text
          // Check if this is at the end (after last group) or in the middle
          if (imageStart > lastGroupEndIndex) {
            // This is at the end - leave unprocessed for next batch
            imageIndices.forEach(idx => ungroupedEndIds.add(messages[idx].id));
            console.log(
              `  ⚠️ Leaving ${imageIndices.length} images without text at end (starting at index ${imageStart}) - will process in next batch`
            );
          } else {
            // This is in the middle - mark as skipped (processed)
            imageIndices.forEach(idx => skippedIds.add(messages[idx].id));
            console.log(
              `  ⚠️ Skipping ${imageIndices.length} images without text in middle (starting at index ${imageStart}) - marking as processed`
            );
          }
        }
      }
    }

    return {
      groups,
      groupedMessageIds: Array.from(groupedIds),
      skippedMessageIds: Array.from(skippedIds),
      ungroupedEndMessageIds: Array.from(ungroupedEndIds),
    };
  }

  /**
   * Group messages from a single sender (backward compatibility)
   */
  private groupMessagesBySender(messages: any[]): MessageGroup[] {
    return this.groupMessagesBySenderWithTracking(messages).groups;
  }

  /**
   * Create a message group from image and text indices
   */
  private createGroup(
    messages: any[],
    startIndex: number,
    imageIndices: number[],
    textIndices: number[],
    groupNumber: number
  ): MessageGroup | null {
    if (imageIndices.length === 0 || textIndices.length === 0) {
      return null;
    }

    // Combine all message indices and sort chronologically
    const allIndices = [...imageIndices, ...textIndices].sort((a, b) => a - b);
    const messageIds = allIndices.map(idx => messages[idx].id);

    return {
      groupId: `Group${groupNumber + 1}`,
      messageIds,
      productContext: `Product with ${imageIndices.length} images and ${textIndices.length} text messages`,
      confidence: 0.9, // High confidence for rule-based grouping
    };
  }
}

