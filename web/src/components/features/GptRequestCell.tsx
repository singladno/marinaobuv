import * as React from 'react';

import { TextModal } from './TextModal';

interface GptRequestCellProps {
  gptRequest: string | null | undefined;
}

export function GptRequestCell({ gptRequest }: GptRequestCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!gptRequest) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const truncated =
    gptRequest.length > 50 ? gptRequest.substring(0, 50) + '...' : gptRequest;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-left text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        title="Нажмите для просмотра полного запроса"
      >
        {truncated}
      </button>

      <TextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="GPT Запрос"
        content={gptRequest}
      />
    </>
  );
}
