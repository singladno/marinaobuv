import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';

export function useLoginPage(options: { disableRedirect?: boolean } = {}) {
  const router = useRouter();
  const { setUserId } = useCart();
  const { refreshUser } = useUser();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.status === 401) {
          // User is not authenticated, stay on login page
          return;
        }
        if (!res.ok) return; // API might be unavailable; skip redirect

        const json = await res.json();
        if (json?.user && !options.disableRedirect) {
          // User is authenticated, redirect to home or intended page
          const urlParams = new URLSearchParams(window.location.search);
          const redirectParam = urlParams.get('redirect');
          router.replace(redirectParam || '/');
        }
      } catch {
        // Network/permission error; ignore to allow login page to render
      }
    })();
  }, [router, options.disableRedirect]);

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error ?? 'Ошибка входа');
    }

    const data = await res.json();
    setUserId(data.user.id);
    // Refresh user data in global context
    await refreshUser();
    router.replace('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await handleLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    phone,
    password,
    error,
    loading,

    // Actions
    setPhone,
    setPassword,
    handleSubmit,
  };
}
