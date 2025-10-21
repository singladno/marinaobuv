interface GptResponse {
  choices?: Array<{
    message?: {
      content?: string;
      finish_reason?: string;
    };
  }>;
  created?: number;
  id?: string;
  model?: string;
}

interface ParsedContent {
  name?: string;
  imageColors?: string[];
  material?: string;
  gender?: string;
  season?: string;
  categoryId?: string;
}

function isGptResponse(response: unknown): response is GptResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'choices' in response &&
    Array.isArray((response as GptResponse).choices)
  );
}

function parseContent(content: string): ParsedContent | string {
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function formatAnalysisResult(content: ParsedContent): string[] {
  const lines = [];
  lines.push('📋 РЕЗУЛЬТАТ АНАЛИЗА:');
  lines.push('');

  if (content.name) {
    lines.push(`📝 Название: ${content.name}`);
  }
  if (content.imageColors && Array.isArray(content.imageColors)) {
    lines.push(`🎨 Цвета: ${content.imageColors.join(', ')}`);
  }
  if (content.material) {
    lines.push(`🧵 Материал: ${content.material}`);
  }
  if (content.gender) {
    lines.push(`👤 Пол: ${content.gender}`);
  }
  if (content.season) {
    lines.push(`🌤️ Сезон: ${content.season}`);
  }
  if (content.categoryId) {
    lines.push(`📂 Категория ID: ${content.categoryId}`);
  }

  return lines;
}

function formatTechnicalInfo(
  response: GptResponse,
  message: { finish_reason?: string }
): string[] {
  const lines = [];
  lines.push('');
  lines.push('🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:');

  if (response.created) {
    lines.push(
      `⏰ Создано: ${new Date(response.created * 1000).toLocaleString('ru-RU')}`
    );
  }
  if (response.id) {
    lines.push(`🆔 ID: ${response.id}`);
  }
  lines.push(`🤖 Модель: ${response.model || 'Не указана'}`);
  lines.push(`🏁 Завершение: ${message.finish_reason || 'Не указано'}`);

  return lines;
}

export function formatGptResponse(response: unknown): string {
  if (!isGptResponse(response)) {
    return JSON.stringify(response, null, 2);
  }

  const message = response.choices?.[0]?.message;
  if (!message?.content) {
    return JSON.stringify(response, null, 2);
  }

  const content = parseContent(message.content);

  if (typeof content === 'object' && content !== null) {
    const analysisLines = formatAnalysisResult(content);
    const technicalLines = formatTechnicalInfo(response, message);
    return [...analysisLines, ...technicalLines].join('\n');
  }

  return `📋 ОТВЕТ GPT:\n\n${content}`;
}
