'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { UserIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';

type CurrentUser = {
  userId: string;
  role: string;
  providerId?: string | null;
  phone?: string;
  name?: string | null;
} | null;

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-transparent">
          <UserIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        {error && (
          <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {user ? (
          <div className="space-y-2">
            <div className="text-muted-foreground px-1 text-sm">
              {user.name || user.phone || 'Аккаунт'}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={logout}
              disabled={loading}
            >
              {loading ? 'Выходим…' : 'Выйти'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Войти
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
