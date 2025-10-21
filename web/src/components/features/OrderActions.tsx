import * as React from 'react';

import type { AdminOrder } from '@/hooks/useOrders';

interface OrderActionsProps {
  order: AdminOrder;
  onPatch: (id: string, patch: Partial<AdminOrder>) => Promise<void>;
}

export function OrderActions({ order, onPatch }: OrderActionsProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(order.status || '');

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(order.status || '');
  };

  const handleSave = async () => {
    if (editValue !== order.status) {
      await onPatch(order.id, { status: editValue });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(order.status || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {isEditing ? (
        <div className="flex items-center space-x-1">
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-xs"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={handleEdit}
          className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
        >
          Редактировать
        </button>
      )}
    </div>
  );
}
