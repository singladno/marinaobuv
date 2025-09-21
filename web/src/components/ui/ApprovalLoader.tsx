import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ApprovalLoaderProps {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentImage?: number;
  totalImages?: number;
  className?: string;
}

export function ApprovalLoader({
  status,
  progress,
  currentImage = 0,
  totalImages = 0,
  className = '',
}: ApprovalLoaderProps) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'completed') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <CheckCircleIcon className="h-5 w-5 text-green-500" />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500"></div>
        </div>

        {/* Progress text */}
        <div className="text-center text-xs text-gray-600">
          {totalImages > 0 ? `${currentImage}/${totalImages}` : 'Processing...'}
        </div>

        {/* Progress bar */}
        {totalImages > 0 && (
          <div className="h-1 w-12 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
