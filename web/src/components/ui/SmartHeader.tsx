'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';

interface SmartHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SmartHeader({ children, className = '' }: SmartHeaderProps) {
  const [isTabletOrDesktop, setIsTabletOrDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsTabletOrDesktop(window.innerWidth >= 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // For phones: normal flow, for iPads: always fixed
  const shouldStick = isTabletOrDesktop;

  return (
    <div
      className={`${
        shouldStick
          ? 'fixed top-0 z-50 bg-white shadow-sm transition-all duration-300'
          : ''
      } ${className}`}
      style={
        shouldStick
          ? {
              left: 'var(--sidebar-width, 224px)',
              right: '0',
              width: 'calc(100vw - var(--sidebar-width, 224px))',
            }
          : {}
      }
    >
      {children}
    </div>
  );
}
