import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';

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
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/request-otp',
  '/api/auth/verify-otp',
  '/api/auth/logout',
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
    return NextResponse.next();
  }

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiredRoles = getRequiredRoles(pathname);
  if (!requiredRoles) {
    return NextResponse.next();
  }

  try {
    // Get session from cookies
    const session = await getSession();

    if (!session) {
      // No session - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has required role
    if (!requiredRoles.includes(session.role)) {
      // User doesn't have required role - redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }

    // User is authenticated and has required role
    return NextResponse.next();
  } catch (error) {
    // Error getting session - redirect to login
    console.error('Middleware auth error:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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
