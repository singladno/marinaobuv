'use client';

import { useAuthRedirect } from '@/hooks/useAuthRedirect';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = false,
  requiredRoles = [],
  fallback = null,
}: AuthGuardProps) {
  const { isAuthenticated, hasRequiredRole, loading } = useAuthRedirect({
    requireAuth,
    requiredRoles,
  });

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // If user doesn't have required role
  if (requireAuth && !hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
