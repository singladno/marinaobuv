import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface OrderCommentProps {
  comment: string;
  setComment: (comment: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  validationError?: boolean;
}

export function OrderComment({
  comment,
  setComment,
  isEditing,
  setIsEditing,
  validationError = false,
}: OrderCommentProps) {
  const [tempComment, setTempComment] = useState(comment);
  const MAX_COMMENT_LENGTH = 500;

  const handleSave = () => {
    setComment(tempComment);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempComment(comment);
    setIsEditing(false);
  };

  const handleCommentChange = (value: string) => {
    if (value.length <= MAX_COMMENT_LENGTH) {
      setTempComment(value);
    }
  };

  return (
    <div
      className={`rounded-card bg-card shadow-card p-6 ${
        validationError ? 'border-card-error' : 'border-card'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Комментарий к заказу
        </h2>
        <button
          className="cursor-pointer text-purple-600 hover:text-purple-700"
          aria-label="Редактировать комментарий"
          title="Редактировать комментарий"
          onClick={() => setIsEditing(!isEditing)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>

      {!isEditing ? (
        <div className="rounded-card border-card p-4">
          {comment ? (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Комментарий</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {comment}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-card border-dashed-placeholder p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="mb-3 text-gray-600">
                Добавьте комментарий к заказу
              </p>
              <Button onClick={() => setIsEditing(true)}>
                Добавить комментарий
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Textarea
              value={tempComment}
              onChange={e => handleCommentChange(e.target.value)}
              placeholder="Укажите особые пожелания, предпочтения по доставке или другую важную информацию..."
              rows={4}
              className="w-full resize-none"
              fullWidth
            />
            <p className="mt-1 text-xs text-gray-500">
              {tempComment.length}/{MAX_COMMENT_LENGTH} символов
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              Сохранить
            </Button>
            <Button onClick={handleCancel} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
