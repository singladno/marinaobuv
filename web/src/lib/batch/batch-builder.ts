import {
  GROUPING_RULES,
  GROUPING_RESPONSE_FORMAT,
} from '../prompts/grouping-prompts';

export type BatchLine = {
  custom_id: string;
  method: 'POST';
  url: '/v1/chat/completions';
  body: any;
};

export function buildGroupingLine(
  customId: string,
  cleanedText: string
): BatchLine {
  return {
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${GROUPING_RULES}\n\n${GROUPING_RESPONSE_FORMAT}`,
        },
        { role: 'user', content: cleanedText },
      ],
      response_format: { type: 'json_object' },
    },
  };
}

export function buildAnalysisLine(
  customId: string,
  textContent: string,
  imageUrls: string[],
  context: string
): BatchLine {
  const messages: any[] = [
    {
      role: 'system',
      content: 'Extract normalized product fields; respond as strict JSON.',
    },
    {
      role: 'user',
      content: `Context: ${context}\n\nText content: ${textContent}`,
    },
  ];

  // Add images to the message
  for (const imageUrl of imageUrls) {
    messages[1].content = [
      { type: 'text', text: messages[1].content },
      { type: 'image_url', image_url: { url: imageUrl } },
    ];
  }

  return {
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-4o-mini',
      messages: messages,
      response_format: { type: 'json_object' },
    },
  };
}

export function buildColorLine(customId: string, imageUrl: string): BatchLine {
  return {
    custom_id: customId,
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Return strictly {"images":[{"color":"черный"|null}]} for the single provided image.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Detect shoe color for this image and return JSON response.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    },
  };
}

export function serializeLines(lines: BatchLine[]): string {
  return lines.map(l => JSON.stringify(l)).join('\n');
}
