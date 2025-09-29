import { XMarkIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { Button } from './Button';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined
);

const useSheet = () => {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a Sheet');
  }
  return context;
};

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  children,
}: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = openProp !== undefined ? openProp : internalOpen;
  const onOpenChange = onOpenChangeProp || setInternalOpen;

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function SheetTrigger({ asChild, children }: SheetTriggerProps) {
  const { onOpenChange } = useSheet();

  if (asChild && React.isValidElement(children)) {
    const c = children as React.ReactElement<any>;
    return React.cloneElement(c, {
      onClick: () => onOpenChange(true),
    });
  }

  return <button onClick={() => onOpenChange(true)}>{children}</button>;
}

interface SheetContentProps {
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}

export function SheetContent({
  side = 'right',
  className = '',
  children,
}: SheetContentProps) {
  const { open, onOpenChange } = useSheet();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const sideClasses = {
    left: 'left-0 top-0 h-full w-80',
    right: 'right-0 top-0 h-full w-80',
    top: 'left-0 top-0 h-80 w-full',
    bottom: 'left-0 bottom-0 h-80 w-full',
  };

  const getTransform = () => {
    if (open) return 'translateX(0)';
    switch (side) {
      case 'left':
        return 'translateX(-100%)';
      case 'right':
        return 'translateX(100%)';
      case 'top':
        return 'translateY(-100%)';
      case 'bottom':
        return 'translateY(100%)';
      default:
        return 'translateX(100%)';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet Content */}
      <div
        className={`
          bg-background border-border fixed z-50 shadow-lg transition-transform duration-300 ease-in-out
          ${sideClasses[side]}
          ${className}
        `}
        style={{
          transform: getTransform(),
        }}
      >
        <div className="flex h-full flex-col">
          <div className="border-border flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Фильтры</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">{children}</div>
        </div>
      </div>
    </>
  );
}
