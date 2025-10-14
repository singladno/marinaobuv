'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function HamburgerMenu({
  isOpen,
  onToggle,
  className = '',
}: HamburgerMenuProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`relative p-0 ${className}`}
      aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
    >
      <div className="relative h-6 w-6">
        {/* Hamburger lines with rounded edges */}
        <span
          className={`absolute left-0 top-1 h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
            isOpen ? 'translate-y-2 rotate-45' : 'translate-y-0'
          }`}
        />
        <span
          className={`absolute left-0 top-3 h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <span
          className={`absolute left-0 top-5 h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
            isOpen ? '-translate-y-2 -rotate-45' : 'translate-y-0'
          }`}
        />
      </div>
    </Button>
  );
}

export default HamburgerMenu;
