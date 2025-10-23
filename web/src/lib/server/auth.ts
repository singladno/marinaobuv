import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function requireAuth(req: NextRequest, requiredRole?: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user: session.user };
}
