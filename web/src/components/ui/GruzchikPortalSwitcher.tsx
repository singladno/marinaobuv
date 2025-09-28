'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';

type CurrentUser = {
  userId?: string;
  role?: string;
  providerId?: string | null;
  phone?: string;
  name?: string | null;
} | null;

export function GruzchikPortalSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGruzchik, setIsGruzchik] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [, setUser] = useState<CurrentUser>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check user role from session
    const checkUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        const userData = json.user ?? null;
        setUser(userData);
        setIsGruzchik(userData?.role === 'GRUZCHIK');
      } catch {
        setUser(null);
        setIsGruzchik(false);
      }
    };

    checkUserRole();
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

  // Show for gruzchik users (both in gruzchik portal and customer portal)
  if (!isGruzchik) return null;

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
            !isGruzchik
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

        {/* Gruzchik Portal */}
        <Link
          href="/gruzchik"
          onClick={closeMenu}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-lg transition-all duration-200 hover:scale-105 sm:px-4 sm:py-3 ${
            isGruzchik
              ? 'bg-orange-600 text-white shadow-orange-500/25'
              : 'bg-white text-gray-700 hover:bg-orange-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 sm:h-10 sm:w-10 dark:bg-orange-900/30 dark:group-hover:bg-orange-900/50">
            <svg
              className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5 dark:text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold sm:text-base">
              Грузчик панель
            </div>
            <div className="text-xs opacity-80 sm:text-sm">
              Управление заказами
            </div>
          </div>
        </Link>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 sm:h-14 sm:w-14 ${
          isGruzchik
            ? 'bg-orange-600 text-white shadow-orange-500/25 focus:ring-orange-500'
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
          } ${isGruzchik ? 'bg-orange-400' : 'bg-blue-400'}`}
        />
      </button>

      {/* Current Portal Indicator */}
      <div
        className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg sm:-right-2 sm:-top-2 sm:h-6 sm:w-6 ${
          isGruzchik ? 'bg-orange-500' : 'bg-blue-500'
        }`}
      >
        {isGruzchik ? 'Г' : 'К'}
      </div>
    </div>
  );
}
