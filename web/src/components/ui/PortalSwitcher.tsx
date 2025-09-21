'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PortalSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsAdmin(pathname.startsWith('/admin'));
    // Show switcher after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Don't render until visible to prevent flash
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Menu Items */}
      <div
        className={`absolute bottom-16 right-0 mb-2 space-y-2 transition-all duration-300 ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        }`}
      >
        {/* Customer Portal */}
        <Link
          href="/"
          onClick={closeMenu}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-lg transition-all duration-200 hover:scale-105 sm:px-4 sm:py-3 ${
            !isAdmin
              ? 'bg-blue-600 text-white shadow-blue-500/25'
              : 'bg-white text-gray-700 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 sm:h-10 sm:w-10 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
            <svg
              className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold sm:text-base">
              Клиентский портал
            </div>
            <div className="text-xs opacity-80 sm:text-sm">
              Просмотр товаров
            </div>
          </div>
        </Link>

        {/* Admin Portal */}
        <Link
          href="/admin"
          onClick={closeMenu}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-lg transition-all duration-200 hover:scale-105 sm:px-4 sm:py-3 ${
            isAdmin
              ? 'bg-purple-600 text-white shadow-purple-500/25'
              : 'bg-white text-gray-700 hover:bg-purple-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 sm:h-10 sm:w-10 dark:bg-purple-900/30 dark:group-hover:bg-purple-900/50">
            <svg
              className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5 dark:text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold sm:text-base">
              Админ панель
            </div>
            <div className="text-xs opacity-80 sm:text-sm">
              Управление товарами
            </div>
          </div>
        </Link>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 sm:h-14 sm:w-14 ${
          isAdmin
            ? 'bg-purple-600 text-white shadow-purple-500/25 focus:ring-purple-500'
            : 'bg-blue-600 text-white shadow-blue-500/25 focus:ring-blue-500'
        }`}
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
          } ${isAdmin ? 'bg-purple-400' : 'bg-blue-400'}`}
        />
      </button>

      {/* Current Portal Indicator */}
      <div
        className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg sm:-right-2 sm:-top-2 sm:h-6 sm:w-6 ${
          isAdmin ? 'bg-purple-500' : 'bg-blue-500'
        }`}
      >
        {isAdmin ? 'A' : 'C'}
      </div>

      {/* Tooltip */}
      <div
        className={`absolute bottom-16 right-0 mb-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg transition-all duration-300 ${
          isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-center">
          <div className="font-semibold">
            {isAdmin ? 'Админ панель' : 'Клиентский портал'}
          </div>
          <div className="text-xs opacity-80">Нажмите для переключения</div>
        </div>
        {/* Arrow */}
        <div className="absolute right-4 top-full h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
