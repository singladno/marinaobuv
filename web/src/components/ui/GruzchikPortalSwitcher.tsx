'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@/contexts/NextAuthUserContext';
import { GruzchikPortalMenuItems } from './GruzchikPortalMenuItems';

type CurrentUser = {
  userId?: string;
  role?: string;
  providerId?: string | null;
  phone?: string;
  name?: string | null;
} | null;

export function GruzchikPortalSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const isOnGruzchik =
    typeof pathname === 'string' && pathname.startsWith('/gruzchik');

  useEffect(() => {
    setMounted(true);
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint is 768px
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Show switcher immediately for testing
    setIsVisible(true);

    return () => window.removeEventListener('resize', checkMobile);
  }, [pathname]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Don't render until visible to prevent flash
  if (!isVisible) return null;

  // Don't render on mobile devices
  if (isMobile) return null;

  // Show for gruzchik users (both in gruzchik portal and customer portal)
  if (user?.role !== 'GRUZCHIK') {
    return null;
  }

  if (!mounted) return null;

  const switcherContent = (
    <div
      className="gruzchik-switcher fixed bottom-4 right-4 z-50 hidden md:bottom-6 md:right-6 md:block"
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        contain: 'none',
        isolation: 'auto',
        willChange: 'auto',
      }}
    >
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Menu Items - show only ONE destination (the other portal) */}
      <div
        className={`absolute bottom-16 right-0 mb-2 space-y-2 transition-all duration-300 ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        }`}
      >
        <GruzchikPortalMenuItems
          isOnGruzchik={isOnGruzchik}
          onClose={closeMenu}
          className="sm:px-4 sm:py-3 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        />
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleMenu}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 sm:h-14 sm:w-14"
        aria-label="Переключить портал"
      >
        {/* Background Animation */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            isOpen ? 'scale-150 bg-white/20' : 'scale-100 bg-transparent'
          }`}
        />

        {/* Icon */}
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          {isOpen ? (
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
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
          ) : (
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          )}
        </div>

        {/* Pulse Animation */}
        <div
          className={`absolute inset-0 animate-ping rounded-full ${
            isOpen ? 'opacity-0' : 'opacity-20'
          } bg-purple-400`}
        />
      </button>
    </div>
  );

  // Render directly to body to avoid any container issues
  return createPortal(switcherContent, document.body);
}
