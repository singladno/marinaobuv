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

  if (loading) {
    return (
      <Button variant="secondary" disabled>
        <UserIcon className="h-5 w-5" />
        Загрузка...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="secondary" disabled>
        <UserIcon className="h-5 w-5" />
        Ошибка
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLoginModal(true)}
          className="hover:bg-transparent"
          aria-label="Войти"
        >
          <UserIcon className="h-4 w-4" />
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
        className="hover:bg-transparent"
        aria-label={user.name || user.phone || 'Пользователь'}
      >
        <UserIcon className="h-4 w-4" />
      </Button>

      {open && anchorRect && (
        <div
          ref={menuRef}
          className="fixed z-50 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: `${anchorRect.left}px`,
            top: `${anchorRect.top}px`,
            width: `${anchorRect.width}px`,
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
