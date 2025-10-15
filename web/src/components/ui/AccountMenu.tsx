'use client';

import { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

import { LoginModal } from '@/components/auth/LoginModal';
import { Button } from '@/components/ui/Button';
import ProfileMenuContent from '@/components/ui/ProfileMenuContent';
import { useUser } from '@/contexts/UserContext';
import { useAccountMenu } from '@/hooks/useAccountMenu';

export default function AccountMenu() {
  const { user, loading, error } = useUser();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    open,
    anchorRect,
    menuRef,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    handleMenuMouseEnter,
    handleMenuMouseLeave,
  } = useAccountMenu();

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLoginModal(true)}
          className="text-white hover:bg-white/10"
          aria-label="Войти"
        >
          <UserIcon className="h-4 w-4 text-white" />
        </Button>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-white hover:bg-white/10"
        aria-label={user.name || user.phone || 'Пользователь'}
      >
        <UserIcon className="h-4 w-4" />
      </Button>

      {open && anchorRect && (
        <div
          ref={menuRef}
          className="fixed z-50 rounded-lg border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: `${anchorRect.left}px`,
            top: `${anchorRect.top}px`,
            width: `${anchorRect.width}px`,
            minWidth: '280px',
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <ProfileMenuContent
            user={user}
            onLogout={handleLogout}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
