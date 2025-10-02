import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUserId } = useCart();
  const { user, clearUser } = useUser();

  // Refs for hover delay management
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync cart with user authentication when user changes
  useEffect(() => {
    setUserId(user?.userId ?? null);
  }, [user, setUserId]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        clearUser();
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
    const iconsContainer = document.getElementById('header-icons');

    if (iconsContainer) {
      const containerRect = iconsContainer.getBoundingClientRect();
      setAnchorRect({
        left: containerRect.left,
        top: containerRect.bottom,
        width: containerRect.width,
        height: containerRect.height,
      });
    } else {
      // Fallback to button positioning if container not found
      setAnchorRect({
        left: rect.left,
        top: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    }
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
