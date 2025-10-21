import * as React from 'react';

import { SourceModal } from './SourceModal';

interface SourceCellProps {
  source:
    | Array<{
        id: string;
        waMessageId: string;
        from: string | null;
        fromName: string | null;
        type: string | null;
        text: string | null;
        timestamp: number | null;
        mediaUrl: string | null;
        mediaMimeType: string | null;
        mediaWidth: number | null;
        mediaHeight: number | null;
        createdAt: string;
        provider: {
          name: string;
        } | null;
      }>
    | null
    | undefined;
}

export function SourceCell({ source }: SourceCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!source || source.length === 0) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        title="Нажмите для просмотра источника"
      >
        {source.length} сообщений
      </button>

      <SourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source={source}
      />
    </>
  );
}
