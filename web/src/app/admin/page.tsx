import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function AdminHome() {
  const session = await getServerSession(authOptions);

  // Redirect EXPORT_MANAGER to exports page, ADMIN to orders page
  if (session?.user?.role === 'EXPORT_MANAGER') {
    redirect('/admin/exports');
  }

  redirect('/admin/orders');
}
