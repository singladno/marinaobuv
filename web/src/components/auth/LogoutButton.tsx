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
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;

    await signOut({
      callbackUrl: callbackUrl,
    });
  };

  return (
    <Button onClick={handleLogout} variant={variant} className={className}>
      {children}
    </Button>
  );
}
