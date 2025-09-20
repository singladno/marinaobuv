'use client';

import clsx from 'clsx';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
};

export function SelectItem({ value, children, onSelect }: SelectItemProps) {
  return (
    <div
      className="hover:bg-muted cursor-pointer rounded-sm px-3 py-2 text-sm"
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  );
}

type SelectContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function SelectContent({ children, className }: SelectContentProps) {
  return (
    <div
      className={clsx(
        'bg-background border-border absolute left-0 right-0 top-full z-50 mt-1 rounded-md border shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

type SelectTriggerProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function SelectTrigger({
  children,
  className,
  onClick,
}: SelectTriggerProps) {
  return (
    <button
      type="button"
      className={clsx(
        'border-border bg-background flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
        'focus:ring-primary/30 focus:border-primary focus:outline-none focus:ring-2',
        'hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  );
}

type SelectValueProps = {
  placeholder?: string;
  value?: string;
};

export function SelectValue({ placeholder, value }: SelectValueProps) {
  return <span>{value || placeholder}</span>;
}

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export function Select({
  value,
  onValueChange,
  children,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  // Find trigger and content from children
  let trigger: React.ReactElement | null = null;
  let content: React.ReactElement | null = null;

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === SelectTrigger) {
        trigger = child;
      } else if (child.type === SelectContent) {
        content = child;
      }
    }
  });

  if (!trigger) {
    console.error('Select component must contain a SelectTrigger');
    return null;
  }

  // Clone trigger with onClick handler
  const triggerWithHandler = React.cloneElement(trigger, {
    onClick: () => setIsOpen(!isOpen),
  });

  // Clone content with onSelect handlers for all SelectItems
  const contentWithHandlers = content
    ? React.cloneElement(content, {
        children: React.Children.map(content.props.children, item => {
          if (React.isValidElement(item) && item.type === SelectItem) {
            return React.cloneElement(item, {
              onSelect: handleSelect,
            });
          }
          return item;
        }),
      })
    : null;

  return (
    <div ref={selectRef} className={clsx('relative', className)}>
      {triggerWithHandler}
      {isOpen && contentWithHandlers}
    </div>
  );
}

export default Select;
