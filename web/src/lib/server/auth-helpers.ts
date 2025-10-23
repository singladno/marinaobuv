import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export type UserRole = 'ADMIN' | 'CLIENT' | 'GRUZCHIK';

export interface AuthenticatedUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
}

/**
 * Simple helper to authenticate and authorize users in API routes
 * Usage:
 *
 * const auth = await requireAuth(request, 'ADMIN');
 * if (auth.error) return auth.error;
 * // Use auth.user.id, auth.user.role, etc.
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: UserRole
): Promise<
  | { user: AuthenticatedUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    // If no specific role required, just check if user is authenticated
    if (!requiredRole) {
      return {
        user: {
          id: session.user.id,
          role: session.user.role,
          name: session.user.name,
          email: session.user.email,
        },
      };
    }

    // Check if user has the required role
    if (session.user.role !== requiredRole) {
      return {
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return {
      user: {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email,
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper to get user ID with role check
 * Usage: const userId = await getUserId(request, 'ADMIN');
 */
export async function getUserId(
  request: NextRequest,
  requiredRole?: UserRole
): Promise<string | null> {
  const auth = await requireAuth(request, requiredRole);
  return auth.user?.id || null;
}

/**
 * Helper to check if user has specific role
 * Usage: const isAdmin = await hasRole(request, 'ADMIN');
 */
export async function hasRole(
  request: NextRequest,
  role: UserRole
): Promise<boolean> {
  const auth = await requireAuth(request);
  return auth.user?.role === role;
}
