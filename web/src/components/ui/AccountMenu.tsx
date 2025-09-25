'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    } catch (e: any) {
      setError(e?.message ?? 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  // Measure header icons container to align dropdown width and position
  useEffect(() => {
    function measure() {
      const el = document.getElementById('header-icons');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setAnchorRect({
        left: rect.left,
        top: rect.bottom,
        width: rect.width,
        height: rect.height,
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
    <div
      className="group relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Button variant="ghost" size="icon" className="hover:bg-transparent">
        <UserIcon className="h-4 w-4" />
      </Button>
      {open && anchorRect && (
        // Fixed-position wrapper with a 5px hover buffer around the menu
        <div
          className="fixed z-40"
          style={{
            left: anchorRect.left - 5,
            top: anchorRect.top - 5,
            width: anchorRect.width + 10,
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div
            className="pointer-events-none select-none"
            style={{ height: 5 }}
          />
          <div
            className="w-full"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
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
        </div>
      )}
    </div>
  );
}
