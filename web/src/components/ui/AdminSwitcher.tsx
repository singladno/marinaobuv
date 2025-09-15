'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function AdminSwitcher() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        setIsAdmin(json.user?.role === 'ADMIN');
      } catch {}
    })();
  }, []);
  if (!isAdmin) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        href="/admin"
        className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white shadow"
      >
        Админ-панель
      </Link>
    </div>
  );
}
