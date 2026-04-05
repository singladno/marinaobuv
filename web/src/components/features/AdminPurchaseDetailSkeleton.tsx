'use client';

import { Card } from '@/components/ui/Card';
import { SmartHeader } from '@/components/ui/SmartHeader';
import ScrollArrows from '@/components/ui/ScrollArrows';

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className ?? ''}`}
    />
  );
}

/** Mirrors `AdminPurchaseItemCard`: index, image block, prices, name, description area. */
function AdminPurchaseItemCardSkeleton() {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden p-3 [contain-intrinsic-size:420px_560px]">
      <SkeletonBar className="absolute right-2 top-2 z-10 h-8 w-8 rounded-md" />
      <div className="mb-3 flex pr-9">
        <SkeletonBar className="h-8 w-16 rounded border border-gray-100" />
      </div>
      <div className="shrink-0">
        <div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mt-3 flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <SkeletonBar className="h-7 w-24" />
          <SkeletonBar className="h-5 w-20" />
        </div>
        <SkeletonBar className="h-5 w-full" />
        <div className="min-h-[2.5rem] space-y-2 rounded-md border border-gray-100 px-2 py-2 dark:border-gray-800">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-[95%]" />
          <SkeletonBar className="h-3 w-4/5" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading UI for `/admin/purchases/[id]`: same shell as the loaded page (SmartHeader + grid)
 * so the transition feels like content filling in rather than a generic spinner.
 */
export function AdminPurchaseDetailSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Загрузка закупки"
    >
      <SmartHeader>
        <div className="border-b bg-white px-4 py-3 sm:px-6 md:py-2.5 lg:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:gap-3 lg:gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <SkeletonBar className="h-9 w-24 shrink-0" />
              <div className="min-w-0 space-y-2">
                <SkeletonBar className="h-7 w-[min(18rem,70vw)] max-w-full sm:w-72" />
                <SkeletonBar className="h-4 w-32" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <SkeletonBar className="h-9 w-10 shrink-0" />
              <SkeletonBar className="h-9 min-w-[7.5rem] flex-1 sm:w-36 sm:flex-initial" />
              <SkeletonBar className="h-9 min-w-[8rem] flex-1 sm:w-40 sm:flex-initial" />
            </div>
          </div>
        </div>
      </SmartHeader>

      <div className="pt-0 md:pt-[5.25rem] lg:pt-20">
        <div
          className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3"
          aria-hidden
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <AdminPurchaseItemCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <ScrollArrows offsetBottomPx={28} showOnMobile />
    </div>
  );
}
