'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { deduplicateRequest } from '@/lib/request-deduplication';

type CurrentUser = {
  userId: string;
  role: string;
  providerId?: string | null;
  phone?: string;
  name?: string | null;
} | null;

interface UserContextType {
  user: CurrentUser;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    return deduplicateRequest('fetch-user', async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
        });
        const json = await res.json();
        setUser(json.user ?? null);
        return json.user;
      } catch (err) {
        setError('Ошибка загрузки пользователя');
        setUser(null);
        throw err;
      } finally {
        setLoading(false);
      }
    });
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const clearUser = () => {
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        setUser,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
