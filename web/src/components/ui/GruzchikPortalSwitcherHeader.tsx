'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

export function GruzchikPortalSwitcherHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const isOnGruzchik =
    typeof pathname === 'string' && pathname.startsWith('/gruzchik');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Show for gruzchik users only
  if (user?.role !== 'GRUZCHIK') return null;

  return (
    <div className="relative">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Menu Items */}
      <div
        className={`absolute left-0 top-full z-50 mt-2 space-y-2 transition-all duration-300 ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        }`}
      >
        {isOnGruzchik ? (
          // Show only Customer portal when currently on gruzchik
          <Link
            href="/"
            onClick={closeMenu}
            className="group flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-gray-700 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200">
              <svg
                className="h-4 w-4 text-blue-600"
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
              <div className="text-sm font-semibold">Клиентский портал</div>
              <div className="text-xs opacity-80">Просмотр товаров</div>
            </div>
          </Link>
        ) : (
          // Show only Gruzchik portal when currently in customer area
          <Link
            href="/gruzchik"
            onClick={closeMenu}
            className="group flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-gray-700 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-orange-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200">
              <svg
                className="h-4 w-4 text-orange-600"
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
              <div className="text-sm font-semibold">Грузчик панель</div>
              <div className="text-xs opacity-80">Управление заказами</div>
            </div>
          </Link>
        )}
      </div>

      {/* Header Toggle Button */}
      <button
        onClick={toggleMenu}
        className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Переключить портал"
      >
        {/* Icon */}
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          {isOpen ? (
            <svg
              className="h-4 w-4"
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
              className="h-4 w-4"
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
      </button>
    </div>
  );
}
