import * as React from 'react';

import { TextModal } from './TextModal';

interface GptResponseCellProps {
  rawGptResponse: string | null | undefined;
}

export function GptResponseCell({ rawGptResponse }: GptResponseCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!rawGptResponse) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(rawGptResponse);
  } catch {
    parsedResponse = { error: 'Invalid JSON' };
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
        content={rawGptResponse}
      />
    </>
  );
}
