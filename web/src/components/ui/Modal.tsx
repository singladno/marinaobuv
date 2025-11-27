import * as React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  className?: string;
  zIndex?: string;
  headerContent?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  zIndex = 'z-50',
  headerContent,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const modalIdRef = React.useRef<string>(`modal-${Math.random().toString(36).substr(2, 9)}`);

  // Ensure component is mounted on client side
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen || !mounted) return;

    // Track if body scroll was locked by this modal
    const wasBodyScrollLocked = document.body.style.overflow === 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find all modal containers with data-modal-id attribute
        const allModalContainers = Array.from(
          document.querySelectorAll('[data-modal-id]')
        ) as HTMLElement[];

        if (allModalContainers.length === 0) {
          e.stopPropagation();
          e.preventDefault();
          onClose();
          return;
        }

        // Find the container with the highest z-index by comparing computed styles
        let topContainer: HTMLElement | null = null;
        let highestZ = -1;

        allModalContainers.forEach(container => {
          const computedStyle = window.getComputedStyle(container);
          const z = parseInt(computedStyle.zIndex) || 0;
          if (z > highestZ) {
            highestZ = z;
            topContainer = container;
          }
        });

        // Only close if this modal's container is the topmost one
        if (modalRef.current && modalRef.current === topContainer) {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }
      }
    };

    // Prevent body scroll when modal is open
    if (!wasBodyScrollLocked) {
      document.body.style.overflow = 'hidden';
    }
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase

    return () => {
      // Only restore scroll if no other modals are open
      const otherModals = Array.from(document.querySelectorAll('[data-modal-id]')).filter(
        el => el !== modalRef.current
      );
      if (otherModals.length === 0 && !wasBodyScrollLocked) {
        document.body.style.overflow = 'unset';
      }
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose, mounted]);

  if (!isOpen || !mounted) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    fullscreen: 'max-w-full h-full',
  };

  const isFullscreen = size === 'fullscreen';

  // Convert Tailwind z-index class to numeric value for comparison
  const getZIndexValue = (zIndexClass: string): number => {
    if (zIndexClass.includes('[')) {
      // Handle arbitrary values like z-[60]
      const match = zIndexClass.match(/\[(\d+)\]/);
      return match ? parseInt(match[1]) : 50;
    }
    // Handle standard Tailwind classes
    const zIndexMap: Record<string, number> = {
      'z-0': 0,
      'z-10': 10,
      'z-20': 20,
      'z-30': 30,
      'z-40': 40,
      'z-50': 50,
    };
    return zIndexMap[zIndexClass] || 50;
  };

  const numericZIndex = getZIndexValue(zIndex);

  const modalContent = (
    <div
      ref={modalRef}
      data-modal-id={modalIdRef.current}
      className={`fixed inset-0 ${zIndex} ${isFullscreen ? '' : 'grid place-items-center p-4'}`}
      style={{ zIndex: numericZIndex }}
      onClick={e => {
        // Only handle backdrop clicks, not content clicks
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          e.preventDefault();
          // Check if this is the topmost modal before closing
          const allModals = Array.from(document.querySelectorAll('[data-modal-id]')) as HTMLElement[];
          if (allModals.length > 0) {
            let topModal: HTMLElement | null = null;
            let highestZ = -1;
            allModals.forEach(modal => {
              const z = parseInt(window.getComputedStyle(modal).zIndex) || 0;
              if (z > highestZ) {
                highestZ = z;
                topModal = modal;
              }
            });
            if (e.currentTarget === topModal) {
              setTimeout(() => {
                onClose();
              }, 0);
            }
          } else {
            setTimeout(() => {
              onClose();
            }, 0);
          }
        }
      }}
      onMouseDown={e => {
        // Stop propagation to prevent parent modals from receiving the event
        if (e.target === e.currentTarget) {
          e.stopPropagation();
        }
      }}
    >
      {/* Backdrop */}
      {!isFullscreen && (
        <div
          className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            // Check if this is the topmost modal before closing
            const allModals = Array.from(document.querySelectorAll('[data-modal-id]')) as HTMLElement[];
            if (allModals.length > 0) {
              let topModal: HTMLElement | null = null;
              let highestZ = -1;
              allModals.forEach(modal => {
                const z = parseInt(window.getComputedStyle(modal).zIndex) || 0;
                if (z > highestZ) {
                  highestZ = z;
                  topModal = modal;
                }
              });
              if (modalRef.current === topModal) {
                setTimeout(() => {
                  onClose();
                }, 0);
              }
            } else {
              setTimeout(() => {
                onClose();
              }, 0);
            }
          }}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
          aria-hidden="true"
        />
      )}

      {/* Modal */}
      <div
        className={`relative ${isFullscreen ? 'w-full h-full' : `w-full ${sizeClasses[size]}`} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={`${isFullscreen ? 'h-full' : 'rounded-card-large max-h-[80vh]'} bg-card shadow-modal flex flex-col overflow-hidden`}>
          {/* Header */}
          <div className="bg-card flex-shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
                {headerContent}
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Use setTimeout to ensure this doesn't interfere with parent modals
                  setTimeout(() => {
                    onClose();
                  }, 0);
                }}
                className="rounded-card cursor-pointer p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Закрыть"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document root level
  return createPortal(modalContent, document.body);
}
