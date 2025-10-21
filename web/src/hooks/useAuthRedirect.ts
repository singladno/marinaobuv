'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useUser } from '@/contexts/UserContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
  skipRedirect?: boolean;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    requireAuth = false,
    requiredRoles = [],
    redirectTo = '/login',
    skipRedirect = false,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();

  useEffect(() => {
    // Skip if still loading or redirect is disabled
    if (loading || skipRedirect) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !user) {
      const loginUrl = new URL(redirectTo, window.location.origin);
      loginUrl.searchParams.set('redirect', pathname);
      router.replace(loginUrl.toString());
      return;
    }

    // If user is authenticated but doesn't have required role
    if (
      user &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      router.replace('/');
      return;
    }

    // If user is authenticated and on login page, redirect to home or intended page
    if (user && pathname === '/login') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      router.replace(redirectParam || '/');
      return;
    }
  }, [
    user,
    loading,
    requireAuth,
    requiredRoles,
    redirectTo,
    pathname,
    router,
    skipRedirect,
  ]);

  return {
    isAuthenticated: !!user,
    hasRequiredRole:
      user && requiredRoles.length > 0
        ? requiredRoles.includes(user.role)
        : true,
    loading,
  };
}
