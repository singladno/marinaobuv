import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const REQUEST_ID_HEADER = 'x-request-id';

function withRequestId(request: NextRequest): NextResponse {
  const existing = request.headers.get(REQUEST_ID_HEADER);
  const requestId =
    existing && existing.trim() !== '' ? existing.trim() : crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['ADMIN'],
  '/gruzchik': ['GRUZCHIK'],
  '/orders': ['ADMIN', 'PROVIDER', 'GRUZCHIK', 'CLIENT'],
  '/profile': ['ADMIN', 'PROVIDER', 'GRUZCHIK', 'CLIENT'],
} as const;

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/catalog',
  '/product',
  '/cart',
  '/api/auth/register',
  '/api/auth/[...nextauth]',
  '/api/products',
  '/api/categories',
  '/api/search',
] as const;

// Check if a path matches any of the public routes
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

// Check if a path matches any protected route and get required roles
function getRequiredRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      return [...roles]; // Convert readonly array to mutable array
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes that are public
  if (pathname.startsWith('/api/') && isPublicRoute(pathname)) {
    return withRequestId(request);
  }

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return withRequestId(request);
  }

  // Check if route requires authentication
  const requiredRoles = getRequiredRoles(pathname);

  if (!requiredRoles) {
    return withRequestId(request);
  }

  try {
    // Get NextAuth token
    const token = await getToken({ req: request });

    if (token && requiredRoles.includes(token.role as string)) {
      return withRequestId(request);
    }

    // No valid authentication - redirect to home
    const redirectUrl = new URL('/', request.url);
    const res = NextResponse.redirect(redirectUrl);
    const requestId =
      request.headers.get(REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  } catch (error) {
    // Edge runtime: cannot use Pino here — keep console for auth failures
    console.error('Middleware auth error:', error);
    const redirectUrl = new URL('/', request.url);
    const res = NextResponse.redirect(redirectUrl);
    const requestId =
      request.headers.get(REQUEST_ID_HEADER)?.trim() || crypto.randomUUID();
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
