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
    console.log('🔍 LOGOUT DEBUG: Starting logout process');
    console.log('🔍 LOGOUT DEBUG: Current URL:', window.location.href);
    console.log(
      '🔍 LOGOUT DEBUG: NEXT_PUBLIC_SITE_URL:',
      process.env.NEXT_PUBLIC_SITE_URL
    );
    console.log('🔍 LOGOUT DEBUG: NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;
    console.log('🔍 LOGOUT DEBUG: Using callbackUrl:', callbackUrl);

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
