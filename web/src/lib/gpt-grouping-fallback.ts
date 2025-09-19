import type { MessageGroup } from './gpt-grouping';

/**
 * Fallback grouping when GPT fails
 */
export function fallbackToSimpleGrouping(
  messages: Array<{
    id: string;
    from: string | null;
    fromName: string | null;
  }>,
  startGroupCounter: number = 0
): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const bySender = messages.reduce(
    (acc, msg) => {
      const sender = msg.from || 'unknown';
      if (!acc[sender]) acc[sender] = [];
      acc[sender].push(msg);
      return acc;
    },
    {} as Record<
      string,
      Array<{
        id: string;
        from: string | null;
        fromName: string | null;
      }>
    >
  );

  let groupCounter = startGroupCounter;
  Object.entries(bySender).forEach(([sender, msgs]) => {
    const groupId = `fallback_${sender}_${groupCounter++}`;
    const group: MessageGroup = {
      groupId,
      messageIds: msgs.map(m => m.id),
      productContext: `Messages from ${msgs[0].fromName || sender}`,
      confidence: 0.5,
    };

    // Trust fallback grouping - no validation needed
    groups.push(group);
  });

  console.log(`   📊 Fallback created ${groups.length} valid groups`);
  return groups;
}
