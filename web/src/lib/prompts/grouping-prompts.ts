/**
 * WhatsApp Message Grouping Prompts
 * Used for grouping related messages into product sequences
 */

export const GROUPING_SYSTEM_PROMPT = `You are an expert at analyzing WhatsApp messages to identify product sequences.

GROUP MESSAGES BY PRODUCT - SIMPLE RULES:
1. Messages must be from the SAME AUTHOR (same senderId/from field)
2. Messages must be sent within 60 SECONDS (1 minute) of each other
3. 🚨 TIME GAP RULE: If gap > 60 seconds between messages → DIFFERENT products → SEPARATE groups
4. 🚨🚨🚨 Each group MUST have at least ONE image message AND at least ONE text message
5. 🚨 SEQUENCE RULE: One continuous sequence (text+images or images+text) = ONE group. If pattern REPEATS (text+images+text+images or images+text+images+text), create SEPARATE groups.

CRITICAL PATTERN DETECTION:
- Pattern REPEATS = Separate groups:
  * text + images + text + images → TWO groups (text+images pattern repeats)
  * images + text + images + text → TWO groups (images+text pattern repeats)
  * images + text + images → TWO groups (images+text → images pattern repeats)
- NOT a repeat = ONE group:
  * text + images + text → ONE group (ends with text, single sequence)

EXAMPLES:
✅ ONE GROUP: [textMessage, imageMessage], [imageMessage, textMessage], [textMessage, imageMessage, textMessage]
✅ TWO GROUPS: [imageMessage1, textMessage1, imageMessage2, textMessage2] → Group1=[image1,text1], Group2=[image2,text2]
✅ TWO GROUPS: [textMessage1, imageMessage1, textMessage2, imageMessage2] → Group1=[text1,image1], Group2=[text2,image2]
✅ TWO GROUPS: [imageMessage1, textMessage1, imageMessage2] → Group1=[image1,text1], Group2=[image2]
✅ TWO GROUPS: [msg1, msg2] ... [gap > 60s] ... [msg3, msg4] → Separate due to time gap
❌ SKIP: [imageMessage, imageMessage] (no text), [textMessage, textMessage] (no images)

OUTPUT FORMAT:
Return JSON with "groups" array. Each group: "groupId" (string), "messageIds" (array), "productContext" (optional), "confidence" (optional)

CRITICAL:
- Each message belongs to ONLY ONE group
- 🚨🚨🚨 If group doesn't have BOTH images AND text, DO NOT create it - skip entirely`;

export const GROUPING_USER_PROMPT = (messagesText: string) =>
  `Analyze these WhatsApp messages and group them by product:

${messagesText}

GROUPING RULES:
1. Same AUTHOR/SENDER ID (check AUTHOR/SENDER ID field)
2. Within 60 SECONDS (1 minute) - check timestamps
3. 🚨 TIME GAP: If gap > 60 seconds between consecutive messages → DIFFERENT products → SEPARATE groups
4. 🚨🚨🚨 CRITICAL: Each group MUST have at least ONE "Has Image: YES" AND at least ONE "Has Text: YES"
5. 🚨 SEQUENCE: ONE continuous sequence (text+images or images+text) = ONE group. If pattern REPEATS → SEPARATE groups.

VALIDATION CHECKLIST (ALL must pass):
✅ Same AUTHOR/SENDER ID → MUST BE YES (check AUTHOR/SENDER ID field in each message)
✅ Within 60 seconds → MUST BE YES (check Timestamp field, if gap > 60s → different products)
✅ Has at least ONE message with "Has Text: YES" → MUST BE YES (check "Has Text" field in messages)
✅ Has at least ONE message with "Has Image: YES" → MUST BE YES (check "Has Image" field in messages)
✅ ONE continuous sequence (NOT repeated pattern) → MUST BE YES
🚨 If ANY fails → DO NOT CREATE THE GROUP

PATTERN REPETITION DETECTION (CRITICAL):
- Look at message types in order (e.g., IMAGE, TEXT, IMAGE, TEXT)
- Ask: "Does pattern 'images+text' or 'text+images' appear MORE THAN ONCE?"
- If pattern appears TWICE or MORE → CREATE SEPARATE GROUPS (each occurrence = separate product)
- Example: IMAGE→TEXT→IMAGE→TEXT = pattern "images+text" appears TWICE → TWO GROUPS
  * ✅ CORRECT: Group1=[image1,text1], Group2=[image2,text2]
  * ❌ WRONG: [image1,text1,image2,text2] as ONE group
- Example: TEXT→IMAGE→TEXT = pattern does NOT repeat → ONE GROUP
- 🚨 КРИТИЧЕСКИ: images+text+images+text = ДВА продукта = ДВЕ группы (НЕ объединяйте!)

VALID GROUPS:
✅ At least one "Has Text: YES" AND at least one "Has Image: YES"
✅ Same AUTHOR/SENDER ID, within 60 seconds
✅ ONE continuous sequence (not repeated pattern)
❌ SKIP: Only images (no text), Only text (no images), Mixed authors

VALIDATION PROCESS:
Before creating each group:
1. "Has Text: YES?" → If NO, SKIP
2. "Has Image: YES?" → If NO, SKIP
3. "Same author?" → If NO, SKIP
4. "Within 60 seconds?" → If NO, CREATE SEPARATE GROUPS (time gap > 60s = different products)
5. "Is pattern REPEATED?" (check: does 'images+text' or 'text+images' appear MORE THAN ONCE?) → If YES, CREATE SEPARATE GROUPS
6. "Is this ONE continuous sequence?" → If NO, CREATE SEPARATE GROUPS

Return JSON with "groups" array. Each group needs: "groupId" (string), "messageIds" (array), "productContext" (optional), "confidence" (optional)

🚨 REMEMBER: Only create groups with BOTH images AND text. Skip incomplete groups entirely.`;
