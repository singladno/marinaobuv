export const GROUPING_RULES = `
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
- Messages for the same product are typically sent within 1-2 seconds of each other
- Time gaps of 10+ seconds often indicate different products
- Time gaps of 30+ seconds almost certainly indicate different products
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

VALID GROUP REQUIREMENTS (STRICT):
- EVERY group MUST contain BOTH images AND text messages — this is MANDATORY
- Groups with ONLY images are INVALID — they must be skipped entirely
- Groups with ONLY text are INVALID — they must be skipped entirely

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
`;

export const GROUPING_RESPONSE_FORMAT = `
RESPONSE (JSON only):
{
  "groups": [
    {
      "groupId": "group_1", 
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": Number
    }
  ]
}`;
