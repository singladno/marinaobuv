import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

function ResetPasswordFormFallback() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-6 w-6 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        <div className="mx-auto mb-2 h-6 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-10 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          <div className="h-10 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
        </div>
        <div className="h-10 w-full animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <Suspense fallback={<ResetPasswordFormFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
