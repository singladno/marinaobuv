import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
    // Get NextAuth token
    const token = await getToken({ req: request });

    if (token && requiredRoles.includes(token.role as string)) {
      return NextResponse.next();
    }

    // No valid authentication - redirect to home
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    // Error getting token - redirect to home
    console.error('Middleware auth error:', error);
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
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
