/**
 * Create the GPT prompt for message grouping
 */
export function createGroupingPrompt(
  messagesForGPT: Array<{
    id: string;
    index: number;
    sender: string;
    type: string;
    text: string;
    hasImage: boolean;
    imageUrl: string | null;
    timestamp: string;
    timeAgo: string;
  }>
): string {
  return `Group WhatsApp messages by product. Analyze message patterns and timestamps to create accurate product groups.

MESSAGES:
${JSON.stringify(messagesForGPT, null, 1)}

CRITICAL RULES:
1. Group messages by product - analyze content to determine what belongs together
2. If you see many messages from same provider, they likely contain MULTIPLE different products
3. Use timeAgo field to determine grouping - messages for same product are usually sent close together in time
4. Analyze imageUrl field when in doubt - different products will have visually different images
5. Separate different products even from same sender - one provider can send multiple products
6. Look for price changes, different product names, or different visual content to separate products
7. When provider sends many messages quickly, analyze image content to determine product boundaries
8. Provider greetings should be grouped with the NEXT product messages, not as separate groups

IMAGE LIMIT RULE (CRITICAL):
- Groups should NOT contain more than 5-6 images maximum
- If a group has more than 6 images, it likely contains multiple different products
- Split large groups based on timestamp gaps and visual content differences
- Most single products are represented by 2-4 images, rarely more than 6

TIMESTAMP ANALYSIS (ENHANCED):
- Messages for the same product are typically sent within 1-5 minutes of each other
- Time gaps of 10+ minutes often indicate different products
- Time gaps of 30+ minutes almost certainly indicate different products
- Look for natural breaks in message flow - these often separate different products
- If you see a cluster of images followed by a long pause, then more messages, split at the pause

SEQUENCE PATTERN ANALYSIS (CRITICAL):
- Images of the same product are usually sent in a continuous sequence
- Look for the pattern: [Image] + [Image] + [Image] + [Text] + [Image] + [Image] + [Image] + [Text]
- This pattern indicates TWO different products - split at the text message boundary
- Common patterns that indicate different products:
  * 3 images → text → 3 images → text (2 different products)
  * 2 images → text → 4 images → text (2 different products)  
  * 1 image → text → 2 images → text (2 different products)
- The text message acts as a separator between different product sequences
- If you see repeated image-text-image-text patterns, create separate groups for each sequence
- Each continuous image sequence (followed by text) represents one product

MIXED SEQUENCE PATTERN (CRITICAL NEW RULE):
- NEVER group images from different products together
- If you see: [Images] + [Text] + [More Images], analyze which images the text describes
- USE TIMING ANALYSIS to determine which images the text describes:
  * If text is sent at the same time as the second group of images → text describes the second group
  * If text is sent between two image groups → analyze content to determine which group it describes
  * If text is sent much later than images → it might describe a different product entirely
- Common patterns and their correct grouping:
  * [Image A1] + [Image A2] + [Text] + [Image B1] + [Image B2] (text sent with B group) → Group 1: [Image A1] + [Image A2], Group 2: [Text] + [Image B1] + [Image B2]
  * [Image A1] + [Text] + [Image B1] + [Image B2] (text sent between groups) → Group 1: [Image A1] + [Text], Group 2: [Image B1] + [Image B2]
  * [Image A1] + [Image A2] + [Image A3] + [Text] (text sent after all images) → Group 1: [Image A1] + [Image A2] + [Image A3] + [Text]
- EDGE CASE: Single image at start might be cut from previous batch
  * If you see: [Single Image] + [Text] + [Multiple Images] → the single image might be orphaned
  * Check if single image has similar timing to the text and multiple images
  * If timing suggests it belongs with the text, group them together
  * If timing suggests it's orphaned, skip it (don't create incomplete groups)
- CRITICAL: NEVER create groups with only images or only text - they are INVALID
- If you cannot form a complete group (images + text), skip those messages entirely
- It's better to skip incomplete groups than to create invalid ones
- Only create groups where text descriptions clearly match the images
- When in doubt, err on the side of separating products rather than mixing them

SINGLE IMAGE EDGE CASE EXCLUSION (CRITICAL NEW RULE):
- EXCLUDE single images that appear to be edge cases from previous batches
- Pattern to exclude: [1 Image] + [Text] + [Several Images] 
- This pattern suggests the single image is from a different batch and should be excluded
- If you see: [Single Image] + [Text] + [Multiple Images] → EXCLUDE the single image
- Only process: [Text] + [Multiple Images] (skip the single image entirely)
- This prevents mixing products from different batches
- The single image is likely an orphaned image from a previous batch
- CRITICAL: When you see this pattern, create groups only for the [Text] + [Multiple Images] part
- Skip the single image completely - do not create any group containing it

VALID GROUP REQUIREMENTS (STRICT):
- EVERY group MUST contain BOTH images AND text messages - this is MANDATORY
- Groups with ONLY images are INVALID - they cannot be processed into products
- Groups with ONLY text are INVALID - they cannot be processed into products
- Text messages MUST include: price, sizes, amount, or product descriptions
- Images MUST show the actual product being described in the text
- Each group must be a complete product unit that can be processed into a catalog entry
- If you cannot create a group with both images and text, DO NOT create that group

GROUPING STRATEGY:
- FIRST: Analyze timing patterns - use timeAgo field to determine which images text describes
- SECOND: Check for mixed sequences - [Images] + [Text] + [More Images] patterns with timing analysis
- THIRD: Analyze sequence patterns - look for image-text-image-text patterns that indicate different products
- FOURTH: Start with timeAgo analysis - group messages that are close in time (within 5 minutes)
- For each time cluster, analyze if images show the same product (check imageUrl field)
- If images are different, split into separate product groups
- If text mentions different prices/products, split accordingly
- Pay special attention to timeAgo gaps - gaps of 10+ minutes often indicate different products
- PRIORITIZE timing analysis: If you see [Image][Image][Image][Text][Image][Image][Image][Text], analyze timing
- If text is sent with the second group of images → Group 1: [Image][Image][Image], Group 2: [Text][Image][Image][Image]
- If text is sent between groups → Group 1: [Image][Image][Image][Text], Group 2: [Image][Image][Image]
- The text message timing determines which images it describes
- CRITICAL: For mixed sequences [Images A] + [Text] + [Images B], use timing to determine which images the text describes
- If text timing suggests it describes Images B, create separate groups:
  * Group 1: [Images A] (incomplete - skip if no description text)
  * Group 2: [Text] + [Images B] (complete product)
- If text timing suggests it describes Images A, create separate groups:
  * Group 1: [Images A] + [Text] (complete product)
  * Group 2: [Images B] (incomplete - skip if no description text)
- If you see sequential image messages followed by one description text message, group them together as one product group
- The description text message should be included with all the preceding image messages in the same group
- This ensures no data is lost when providers send multiple individual image messages with shared descriptions
- Example: Message1[Image] + Message2[Image] + Message3[Image] + Message4[Text] = One product group
- ENFORCE the 5-6 image limit - if a group exceeds this, split it based on timestamps and content
- ENFORCE timing patterns - use timeAgo to determine correct image-text associations
- CRITICAL: Only create groups that have BOTH images AND text - incomplete groups are useless for product processing

VALIDATION RULES (MANDATORY):
- Before creating any group, verify it contains at least 1 image AND at least 1 text message
- Text messages must contain product information (price, sizes, description, etc.)
- Images must show the product being described in the text
- CRITICAL: Text descriptions must clearly match the images in the same group
- CRITICAL: Use timing analysis (timeAgo field) to determine which images the text describes
- If text timing suggests it describes different images, split the group accordingly
- ABSOLUTELY FORBIDDEN: Groups with only images OR only text - these are INVALID and must be skipped
- If you cannot form a complete group (images + text), skip those messages entirely
- It's better to have fewer, complete groups than many incomplete groups
- Each group must be processable into a complete product catalog entry
- NEVER mix images from different products in the same group
- When in doubt about which images a text describes, use timing analysis first, then err on the side of separation
- Handle edge cases: single images at batch boundaries might be orphaned - skip them if they can't form complete groups
- REMEMBER: Incomplete groups are worse than no groups - skip them entirely

RESPONSE (JSON only):
{
  "groups": [
    {
      "groupId": "group_1", 
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": 0.95
    }
  ]
}`;
}
