'use client';

import { ProfileIcon } from '@/components/auth/ProfileIcon';

interface HeaderWithAuthProps {
  children?: React.ReactNode;
}

export function HeaderWithAuth({ children }: HeaderWithAuthProps) {
  return (
    <header className="bg-white shadow-sm dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              MarinaObuv
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {children}

            {/* Profile Icon */}
            <ProfileIcon />
          </nav>
        </div>
      </div>
    </header>
  );
}
