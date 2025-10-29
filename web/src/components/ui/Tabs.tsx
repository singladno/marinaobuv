import * as React from 'react';

interface TabsProps {
  value: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  value,
  onChange,
  onValueChange,
  children,
  className = '',
}: TabsProps) {
  return (
    <div className={`flex w-full ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const c = child as React.ReactElement<any>;
          return React.cloneElement(c, {
            ...c.props,
            isActive: c.props.value === value,
            onClick: () => (onValueChange || onChange)?.(c.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function Tab({
  // value,
  children,
  isActive = false,
  onClick,
  className = '',
}: TabProps & { isActive?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 cursor-pointer rounded-none border-b-2 py-3 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
      } ${className}`}
    >
      {children}
    </button>
  );
}
