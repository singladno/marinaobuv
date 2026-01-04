import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export type UserRole = 'ADMIN' | 'CLIENT' | 'GRUZCHIK' | 'PROVIDER' | 'EXPORT_MANAGER';

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
  requiredRole?: UserRole | UserRole[]
): Promise<
  | { user: AuthenticatedUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  try {
    const session = await getServerSession(authOptions);

    console.log('🔍 Full session data:', {
      session: session ? 'exists' : 'null',
      user: session?.user ? 'exists' : 'null',
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });

    if (!session?.user) {
      console.log('❌ No session or user found');
      return {
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    console.log('🔍 Session user data:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name,
    });

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
    // ADMIN can access all endpoints
    if (session.user.role === 'ADMIN') {
      // ADMIN can access everything
    } else if (requiredRole) {
      // Check if user has one of the required roles
      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];
      if (!allowedRoles.includes(session.user.role as UserRole)) {
        return {
          error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        };
      }
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
  requiredRole?: UserRole | UserRole[]
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

/**
 * Helper to check if user has export access (ADMIN or EXPORT_MANAGER)
 * Usage: const canExport = await hasExportAccess(request);
 */
export async function hasExportAccess(request: NextRequest): Promise<boolean> {
  const auth = await requireAuth(request);
  if (auth.error) return false;
  const role = auth.user?.role;
  return role === 'ADMIN' || role === 'EXPORT_MANAGER';
}
