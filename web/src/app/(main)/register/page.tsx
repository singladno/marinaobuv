'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home - auth is now handled by modal
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Перенаправление...
        </p>
      </div>
    </div>
  );
}
