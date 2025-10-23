'use client';

import { useUser } from '@/contexts/NextAuthUserContext';
import { MobileProfile } from '@/components/features/profile/MobileProfile';

export default function ProfilePage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <MobileProfile user={user} />;
}
