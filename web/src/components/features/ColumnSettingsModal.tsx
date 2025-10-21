import * as React from 'react';

import { Modal } from '@/components/ui/Modal';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface ColumnSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
  onReset: () => void;
}

export function ColumnSettingsModal({
  isOpen,
  onClose,
  columns,
  onToggleColumn,
  onReset,
}: ColumnSettingsModalProps) {
  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройка колонок"
      size="md"
    >
      <div className="flex h-full flex-col">
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Показано колонок: {visibleCount} из {totalCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Выберите колонки для отображения в таблице
                </p>
              </div>
              <button
                onClick={onReset}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Сбросить
              </button>
            </div>
          </div>

          {/* Column list */}
          <div className="space-y-3">
            {columns.map(column => (
              <div
                key={column.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor={`column-${column.id}`}
                    className="flex cursor-pointer items-center space-x-3"
                  >
                    <input
                      id={`column-${column.id}`}
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => onToggleColumn(column.id)}
                      disabled={column.required}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                    <span
                      className={`text-sm font-medium ${
                        column.required
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {column.label}
                    </span>
                  </label>
                  {column.required && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Обязательная
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              onClick={onClose}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
