'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Suspense } from 'react';

import { DraftTablePage } from '@/components/features/DraftTablePage';

function AdminDraftsPageContent() {
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

function AdminDraftsPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600"
            ></div>
          ))}
        </div>
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"
                ></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDraftsPage() {
  return (
    <Suspense fallback={<AdminDraftsPageFallback />}>
      <AdminDraftsPageContent />
    </Suspense>
  );
}
