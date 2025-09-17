import * as React from 'react';

import { TextModal } from './TextModal';

interface TextCellProps {
  value: string | null;
  label: string;
  maxLength?: number;
}

export function TextCell({ value, label, maxLength = 50 }: TextCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!value) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const displayValue = value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-left text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        title="Нажмите для просмотра полного текста"
      >
        {displayValue}
      </button>

      <TextModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={label}
        content={value}
      />
    </>
  );
}
