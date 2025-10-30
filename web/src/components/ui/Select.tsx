'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  selectedText?: string;
  setSelectedText?: (text: string) => void;
  registerItem?: (value: string, text: string) => void;
  disabled?: boolean;
  preferredPlacement?: 'auto' | 'top' | 'bottom';
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function Select({
  value,
  onValueChange,
  children,
  className,
  disabled = false,
  placement = 'auto',
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedText, setSelectedText] = React.useState<string>('');
  const [items, setItems] = React.useState<Map<string, string>>(new Map());
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const registerItem = React.useCallback(
    (itemValue: string, itemText: string) => {
      setItems(prev => new Map(prev).set(itemValue, itemText));
    },
    []
  );

  // Set initial selected text when value changes
  React.useEffect(() => {
    if (value && items.has(value)) {
      setSelectedText(items.get(value) || '');
    }
  }, [value, items]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        isOpen,
        setIsOpen,
        triggerRef,
        selectedText,
        setSelectedText,
        registerItem,
        disabled,
        preferredPlacement: placement,
      }}
    >
      <div className={cn('relative', className)}>{children}</div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ children, className, 'aria-label': ariaLabel, ...props }, ref) => {
  const { isOpen, setIsOpen, triggerRef, disabled } =
    React.useContext(SelectContext);

  // Combine the forwarded ref with our internal ref
  const combinedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (triggerRef) {
        triggerRef.current = node;
      }
      if (ref) {
        if (typeof ref === 'function') {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    },
    [triggerRef, ref]
  );

  return (
    <button
      ref={combinedRef}
      type="button"
      className={cn(
        'flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-none outline-none',
        'placeholder:text-gray-500',
        'focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:ring-offset-0',
        'hover:border-gray-300',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
        'dark:focus:border-purple-400 dark:focus:ring-purple-800',
        className
      )}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      aria-label={ariaLabel}
      aria-expanded={isOpen ? 'true' : 'false'}
      disabled={disabled}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className={cn(
          'h-4 w-4 text-gray-400 transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, children, ...props }, ref) => {
    const { selectedText } = React.useContext(SelectContext);

    return (
      <span ref={ref} className="block truncate" {...props}>
        {children || selectedText || placeholder}
      </span>
    );
  }
);
SelectValue.displayName = 'SelectValue';

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps
>(({ children, className, ...props }, ref) => {
  const { isOpen, setIsOpen, triggerRef, preferredPlacement } = React.useContext(SelectContext);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const [placement, setPlacement] = React.useState<'bottom' | 'top'>('bottom');
  const [mounted, setMounted] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Ensure component is mounted on client side
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest('[data-select-content]') &&
        !triggerRef?.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen, triggerRef]);

  React.useEffect(() => {
    if (isOpen && triggerRef?.current && mounted) {
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const viewportSpaceBelow = window.innerHeight - rect.bottom;
      const autoFlip = viewportSpaceBelow < 200;
      const shouldFlipUp = preferredPlacement === 'top' ? true : preferredPlacement === 'bottom' ? false : autoFlip;
      setPlacement(shouldFlipUp ? 'top' : 'bottom');
      // For fixed-positioned portal content, rect values are viewport-relative;
      // do NOT add window scroll offsets, or the menu will drift off-screen.
      setPosition({
        top: shouldFlipUp ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen, triggerRef, mounted, preferredPlacement]);

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      ref={(node) => {
        if (typeof ref === 'function') ref(node as HTMLDivElement);
        else if (ref && 'current' in (ref as any)) (ref as any).current = node;
        contentRef.current = node as HTMLDivElement | null;
      }}
      data-select-content
      className={cn(
        'fixed z-[110000] rounded-lg border border-gray-200 bg-white shadow-xl',
        'dark:border-gray-600 dark:bg-gray-800',
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        transform: placement === 'top' ? 'translateY(calc(-100% - 6px))' : 'translateY(6px)',
      }}
      {...props}
    >
      <div
        className={cn(
          'p-1 max-h-[320px] overflow-auto',
          placement === 'top' && ''
        )}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
});
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, className, ...props }, ref) => {
    const {
      value: selectedValue,
      onValueChange,
      setIsOpen,
      setSelectedText,
      registerItem,
    } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;

    // Register this item when it mounts
    React.useEffect(() => {
      registerItem?.(value, children as string);
    }, [value, children, registerItem]);

    const handleClick = () => {
      onValueChange?.(value);
      setSelectedText?.(children as string);
      setIsOpen(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none',
          'hover:bg-gray-100 dark:hover:bg-gray-700',
          isSelected &&
            'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';
