import React from 'react';

interface AIIndicatorProps {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  className?: string;
}

export function AIIndicator({ status, className = '' }: AIIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'completed') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg
          className="h-5 w-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg
          className="h-5 w-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div
        className={`flex flex-col items-center justify-center space-y-1 ${className}`}
      >
        {/* Spinning loader */}
        <div className="relative">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500"></div>
        </div>

        {/* AI processing text */}
        <div className="text-center text-xs text-gray-600">AI анализ...</div>
      </div>
    );
  }

  return null;
}
