'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  providerId?: string | null;
  phone?: string | null;
} | null;

interface UserContextType {
  user: CurrentUser;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function NextAuthUserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();

  const redirectToLoginIfProtected = useCallback(() => {
    const protectedRoutes = ['/admin', '/gruzchik', '/orders', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    );

    // Don't redirect if we're still loading or if status is loading
    if (loading || status === 'loading') {
      return;
    }

    // Only redirect if we're absolutely sure the user is not authenticated
    if (isProtectedRoute && !user && status === 'unauthenticated') {
      router.replace('/');
    }
  }, [pathname, router, user, loading, status]);

  const fetchUser = useCallback(async () => {
    try {
      // Debounce: prevent calls within 1 second of each other
      const now = Date.now();
      if (now - lastFetchTime < 1000) {
        return;
      }
      setLastFetchTime(now);

      setLoading(true);
      setError(null);

      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated' || !session) {
        setUser(null);
        // Only redirect if we're sure the user is not authenticated
        if (status === 'unauthenticated') {
          redirectToLoginIfProtected();
        }
        return;
      }

      // Get additional user data from our API
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (res.status === 401) {
        setUser(null);
        redirectToLoginIfProtected();
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setUser(json.user ?? null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Ошибка загрузки пользователя');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [status, session, redirectToLoginIfProtected, lastFetchTime]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;
    await signOut({
      callbackUrl: callbackUrl,
    });
  }, []);

  // Single effect to handle user fetching with proper dependencies
  useEffect(() => {
    // Only fetch if we have a session and haven't loaded user yet, or if session changed
    if (
      status === 'authenticated' &&
      session &&
      (!user || user.id !== session.user?.id)
    ) {
      fetchUser();
    } else if (status === 'unauthenticated' && user) {
      setUser(null);
    }
  }, [status, session, user]); // Removed fetchUser from dependencies to prevent circular dependency

  // Handle redirect when user becomes null on protected routes
  useEffect(() => {
    if (
      !loading &&
      !user &&
      status === 'unauthenticated' &&
      pathname.startsWith('/profile')
    ) {
      redirectToLoginIfProtected();
    }
  }, [user, loading, status, pathname, redirectToLoginIfProtected]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a NextAuthUserProvider');
  }
  return context;
}
