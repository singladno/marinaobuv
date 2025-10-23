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
  const router = useRouter();
  const pathname = usePathname();

  const redirectToLoginIfProtected = useCallback(() => {
    const protectedRoutes = ['/admin', '/gruzchik', '/orders', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      // Redirect to home - auth is now handled by modal
      router.replace('/');
    }
  }, [pathname, router]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      if (status === 'loading') {
        return;
      }

      if (status === 'unauthenticated' || !session) {
        setUser(null);
        redirectToLoginIfProtected();
        return;
      }

      // Get additional user data from our API
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
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
      setError('Ошибка загрузки пользователя');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    fetchUser();
  }, [session, status]);

  // Handle redirect when user becomes null on protected routes
  useEffect(() => {
    if (!loading && !user && status === 'unauthenticated') {
      redirectToLoginIfProtected();
    }
  }, [user, loading, status, redirectToLoginIfProtected]);

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
