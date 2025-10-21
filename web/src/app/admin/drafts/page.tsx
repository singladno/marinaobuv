'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { DraftTablePage } from '@/components/features/DraftTablePage';

export default function AdminDraftsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial status from URL params, default to 'approved'
  const initialStatus = searchParams.get('tab') || 'approved';

  // Handle tab change with URL update
  const handleStatusChange = React.useCallback(
    (newStatus: string | undefined) => {
      if (newStatus) {
        // Update URL first (this is fast)
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', newStatus);
        router.push(`/admin/drafts?${params.toString()}`, { scroll: false });
      }
    },
    [searchParams, router]
  );

  return (
    <DraftTablePage
      initialStatus={initialStatus}
      onStatusChange={handleStatusChange}
      searchParams={searchParams}
      router={router}
    />
  );
}
