'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Select = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || '');

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  return (
    <div className="relative">
      <button
        ref={ref}
        type="button"
        className={cn(
          'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={handleToggle}
        {...props}
      >
        {children}
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full rounded-md border shadow-md">
          <div className="p-1">
            {React.Children.map(children, child => {
              if (
                React.isValidElement(child) &&
                (child.type as any) === SelectContent
              ) {
                const c = child as React.ReactElement<any>;
                return React.cloneElement(c, {
                  onSelect: handleSelect,
                  selectedValue,
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
});
Select.displayName = 'Select';

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    value?: string;
    placeholder?: string;
  }
>(({ className, children, placeholder, ...props }, ref) => (
  <span ref={ref} className={cn('block truncate', className)} {...props}>
    {children || placeholder}
  </span>
));
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: (value: string) => void;
    selectedValue?: string;
  }
>(({ className, children, onSelect, selectedValue, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-popover text-popover-foreground relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
      className
    )}
    {...props}
  >
    {React.Children.map(children, child => {
      if (React.isValidElement(child) && (child.type as any) === SelectItem) {
        const c = child as React.ReactElement<any>;
        return React.cloneElement(c, {
          onSelect,
          selectedValue,
        });
      }
      return child;
    })}
  </div>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    onSelect?: (value: string) => void;
    selectedValue?: string;
  }
>(({ className, children, value, onSelect, selectedValue, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      selectedValue === value && 'bg-accent text-accent-foreground',
      className
    )}
    onClick={() => onSelect?.(value)}
    {...props}
  >
    {children}
  </div>
));
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
