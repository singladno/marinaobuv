'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

export function ProductBackButton() {
  const router = useRouter();

  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Назад
    </Button>
  );
}
