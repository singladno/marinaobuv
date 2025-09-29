import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { useCart } from '@/contexts/CartContext';

type CurrentUser = {
  userId: string;
  role: string;
  providerId?: string | null;
  phone?: string;
  name?: string | null;
} | null;

export function useAccountMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserId } = useCart();

  // Refs for hover delay management
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) {
          setUser(json.user ?? null);
          // Sync cart with user authentication
          setUserId(json.user?.userId ?? null);
        }
      } catch {
        if (!cancelled) {
          setError('Ошибка загрузки пользователя');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUserId]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setUserId(null);
        router.push('/');
      }
    } catch {
      setError('Ошибка выхода');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setAnchorRect({
      left: rect.left,
      top: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleMenuMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    open,
    anchorRect,
    user,
    loading,
    error,
    menuRef,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    handleMenuMouseEnter,
    handleMenuMouseLeave,
  };
}
