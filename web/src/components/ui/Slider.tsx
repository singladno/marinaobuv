'use client';

import clsx from 'clsx';
import React from 'react';

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
};

export function Slider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  ...rest
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onValueChange([newValue, value[1]]);
  };

  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className={clsx(
          'bg-muted h-2 w-full cursor-pointer appearance-none rounded-lg',
          'focus:ring-primary/30 focus:outline-none focus:ring-2',
          className
        )}
        {...rest}
      />
      <div className="text-muted-foreground mt-1 flex justify-between text-xs">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default Slider;
