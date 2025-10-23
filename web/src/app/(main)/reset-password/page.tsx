import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
