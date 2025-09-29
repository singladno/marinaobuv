'use client';

import { UserIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import ProfileMenuContent from '@/components/ui/ProfileMenuContent';
import { useAccountMenu } from '@/hooks/useAccountMenu';

export default function AccountMenu() {
  const {
    open,
    anchorRect,
    user,
    loading,
    error,
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
      <Button
        variant="secondary"
        onClick={() => (window.location.href = '/login')}
      >
        <UserIcon className="h-5 w-5" />
        Войти
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <UserIcon className="h-5 w-5" />
        {user.name || user.phone || 'Пользователь'}
      </Button>

      {open && anchorRect && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-48 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: anchorRect.left,
            top: anchorRect.top,
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
