'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/NextAuthUserContext';
import { AuthModal } from './AuthModal';
import { UserProfile } from './UserProfile';
import { Button } from '@/components/ui/Button';

export function ProfileIcon() {
  const { user, loading } = useUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleProfileClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2">
        <UserProfile />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={handleProfileClick}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        <svg
          className="h-6 w-6"
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
        <span className="hidden sm:inline">Войти</span>
      </Button>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
