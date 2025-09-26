'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { UserIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';
import ProfileMenuContent from '@/components/ui/ProfileMenuContent';

type CurrentUser = {
  userId: string;
  role: string;
  providerId?: string | null;
  phone?: string;
  name?: string | null;
} | null;

export default function AccountMenu() {
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
          setUser(null);
          setUserId(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUserId]);

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      setUser(null);
      setUserId(null); // Clear cart user association
      setOpen(false);
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  // Improved hover handlers with delay
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200); // 200ms delay before closing
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(!open);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Measure header icons container to align dropdown width and position
  useEffect(() => {
    function measure() {
      const el = document.getElementById('header-icons');
      if (!el) return;
      const rect = el.getBoundingClientRect();

      // Validate rect values to prevent NaN
      const left = isNaN(rect.left) ? 0 : rect.left;
      const top = isNaN(rect.bottom) ? 0 : rect.bottom;
      const width = isNaN(rect.width) ? 200 : rect.width;
      const height = isNaN(rect.height) ? 40 : rect.height;

      setAnchorRect({
        left,
        top,
        width,
        height,
      });
    }
    if (open) {
      measure();
      window.addEventListener('resize', measure);
      window.addEventListener('scroll', measure, { passive: true });
    }
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure as any);
    };
  }, [open]);

  return (
    <div className="group relative">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-transparent"
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <UserIcon className="h-4 w-4" />
      </Button>
      {open && anchorRect && (
        <div
          ref={menuRef}
          className="fixed z-40"
          // eslint-disable-next-line react/forbid-dom-props
          // eslint-disable-next-line react/no-unknown-property
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Dynamic positioning requires inline styles
          // eslint-disable-next-line react/no-unknown-property
          style={{
            left: isNaN(anchorRect.left) ? 0 : anchorRect.left,
            top: isNaN(anchorRect.top) ? 0 : anchorRect.top + 8, // 8px gap between trigger and menu
            width: isNaN(anchorRect.width) ? 200 : anchorRect.width,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="dialog"
          aria-label="User account menu"
        >
          {/* Invisible bridge to prevent gap issues */}
          <div
            className="pointer-events-auto absolute -top-2 left-0 right-0 h-2"
            onMouseEnter={handleMouseEnter}
          />

          {error ? (
            <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-xl">
              {error}
            </div>
          ) : (
            <ProfileMenuContent
              user={user}
              onLogout={logout}
              loading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
