'use client';

// import clsx from 'clsx';
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
  // className,
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

  const percentage = ((value[0] - min) / (max - min)) * 100;

  return (
    <div className="relative">
      {/* Custom slider track */}
      <div className="relative h-2 w-full">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-gray-200"></div>
        {/* Active track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gray-400"
          style={{ width: `${percentage}%` }}
        ></div>
        {/* Slider handle */}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 transform rounded-full border-2 border-gray-400 bg-white shadow-sm"
          style={{ left: `calc(${percentage}% - 8px)` }}
        ></div>
      </div>

      {/* Hidden input for accessibility */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        {...rest}
      />
    </div>
  );
}

export default Slider;
