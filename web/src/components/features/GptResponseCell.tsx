import * as React from 'react';

import { TextModal } from './TextModal';

function formatGptResponse(response: any): string {
  // Handle OpenAI API response format
  if (response.choices && response.choices[0] && response.choices[0].message) {
    const message = response.choices[0].message;
    let content = message.content;

    // Try to parse the content as JSON if it's a string
    if (typeof content === 'string') {
      try {
        const parsedContent = JSON.parse(content);
        content = parsedContent;
      } catch {
        // Keep as string if not valid JSON
      }
    }

    // Format the content in a readable way
    if (typeof content === 'object' && content !== null) {
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

      lines.push('');
      lines.push('🔧 ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ:');
      lines.push(
        `⏰ Создано: ${new Date(response.created * 1000).toLocaleString('ru-RU')}`
      );
      lines.push(`🆔 ID: ${response.id}`);
      lines.push(`🤖 Модель: ${response.model || 'Не указана'}`);
      lines.push(`🏁 Завершение: ${message.finish_reason || 'Не указано'}`);

      return lines.join('\n');
    } else {
      // If content is just a string, display it as is
      return `📋 ОТВЕТ GPT:\n\n${content}`;
    }
  }

  // Fallback to formatted JSON
  return JSON.stringify(response, null, 2);
}

interface GptResponseCellProps {
  rawGptResponse: string | object | null | undefined;
}

export function GptResponseCell({ rawGptResponse }: GptResponseCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!rawGptResponse) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  // Handle both string and object responses
  let parsedResponse;
  let modalContent;

  if (typeof rawGptResponse === 'string') {
    try {
      parsedResponse = JSON.parse(rawGptResponse);
      modalContent = formatGptResponse(parsedResponse);
    } catch {
      parsedResponse = { error: 'Invalid JSON' };
      modalContent = rawGptResponse;
    }
  } else if (typeof rawGptResponse === 'object') {
    parsedResponse = rawGptResponse;
    modalContent = formatGptResponse(rawGptResponse);
  } else {
    parsedResponse = { error: 'Invalid response' };
    modalContent = String(rawGptResponse);
  }

  const displayText = parsedResponse.error
    ? 'Ошибка парсинга'
    : parsedResponse.name || 'Без названия';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-left text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        title="Нажмите для просмотра полного ответа"
      >
        {displayText}
      </button>

      <TextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="GPT Ответ"
        content={modalContent}
      />
    </>
  );
}
