import type { Role } from '@prisma/client';
import { NextRequest } from 'next/server';

import { getSession } from '@/lib/server/session';

export type AppRole = Role;

export type AuthContext = {
  userId?: string;
  role: AppRole | null;
  providerId?: string | null;
};

export function getAuthFromHeaders(req: NextRequest): AuthContext {
  const roleRaw = req.headers.get('x-role');
  const userId = req.headers.get('x-user-id') ?? undefined;
  const providerId = req.headers.get('x-provider-id') ?? undefined;

  const allowed: Role[] = ['ADMIN', 'PROVIDER', 'GRUZCHIK', 'CLIENT'];
  const role = allowed.includes((roleRaw as Role) ?? ('' as Role))
    ? (roleRaw as Role)
    : null;

  return { userId, role, providerId };
}

export async function requireRole(
  req: NextRequest,
  roles: AppRole[]
): Promise<AuthContext> {
  const headerAuth = getAuthFromHeaders(req);
  if (headerAuth.role && roles.includes(headerAuth.role)) return headerAuth;

  const session = await getSession();
  if (session && roles.includes((session.role as AppRole) ?? ('' as AppRole))) {
    return {
      userId: session.userId,
      role: session.role as AppRole,
      providerId: session.providerId,
    };
  }

  const err = new Error('Forbidden');
  // @ts-expect-error attach status for route handlers
  err.status = 403;
  throw err;
}
