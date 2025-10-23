import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { signOut } from 'next-auth/react';

import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/NextAuthUserContext';

type CurrentUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  providerId?: string | null;
  phone?: string | null;
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
  const { user, logout } = useUser();

  // Refs for hover delay management
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync cart with user authentication when user changes
  useEffect(() => {
    setUserId(user?.id ?? null);
  }, [user, setUserId]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setUserId(null);
      router.push('/');
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
    const dropdownWidth = 280; // Fixed width for the dropdown
    const viewportWidth = window.innerWidth;

    // Calculate horizontal position with responsive adjustment
    let left = rect.left;

    // If dropdown would go off-screen to the right, align it to the right edge of the button
    if (left + dropdownWidth > viewportWidth - 16) {
      // 16px margin from edge
      left = rect.right - dropdownWidth;
    }

    // Ensure dropdown doesn't go off-screen to the left
    if (left < 16) {
      left = 16;
    }

    setAnchorRect({
      left,
      top: rect.bottom + 8, // 8px gap below the button
      width: dropdownWidth,
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
