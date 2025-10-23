'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

interface LogoutButtonProps {
  className?: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'subtle'
    | 'ghost'
    | 'success'
    | 'danger'
    | 'warning';
  children?: React.ReactNode;
}

export function LogoutButton({
  className,
  variant = 'outline',
  children = 'Выйти',
}: LogoutButtonProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <Button onClick={handleLogout} variant={variant} className={className}>
      {children}
    </Button>
  );
}
