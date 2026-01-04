import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/Button';

interface ProfileMenuContentProps {
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    role: string;
    providerId?: string | null;
  } | null;
  onLogout?: () => void;
  loading?: boolean;
}

export default function ProfileMenuContent({
  user,
  onLogout,
  loading,
}: ProfileMenuContentProps) {
  const pathname = usePathname();
  // If user is not logged in, only show the login button
  if (!user) {
    return (
      <div className="w-full rounded-lg bg-white p-0 text-gray-900">
        <div className="p-2">
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-start">
              Войти
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If user is logged in, show full profile menu
  return (
    <div className="w-full rounded-lg bg-white p-0 text-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-6 w-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold">
            {user?.name || 'Имя не указано'}
          </div>
          <div className="truncate text-sm text-gray-500">
            {user?.email || user?.phone || ''}
          </div>
        </div>
      </div>

      <nav className="p-2">
        <MenuItem href="/orders" icon={BoxIcon} label="Заказы" />
        <MenuItem href="/favorites" icon={HeartIcon} label="Избранное" />
        {(user?.role === 'ADMIN' || user?.role === 'EXPORT_MANAGER') && (
          <MenuItem
            href={
              pathname.startsWith('/admin')
                ? '/'
                : user?.role === 'EXPORT_MANAGER'
                  ? '/admin/exports'
                  : '/admin'
            }
            icon={AdminIcon}
            label={
              pathname.startsWith('/admin')
                ? 'Клиентский портал'
                : user?.role === 'EXPORT_MANAGER'
                  ? 'Панель экспорта'
                  : 'Админ-панель'
            }
          />
        )}
        {user?.role === 'GRUZCHIK' && (
          <MenuItem
            href={pathname.startsWith('/gruzchik') ? '/' : '/gruzchik'}
            icon={GruzchikIcon}
            label={pathname.startsWith('/gruzchik') ? 'Клиентский портал' : 'Панель грузчика'}
          />
        )}
      </nav>

      <div className="border-t border-gray-100 p-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLogout}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Выходим…</span>
            </span>
          ) : (
            'Выйти'
          )}
        </Button>
      </div>
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-base">{label}</span>
    </Link>
  );
}

function BoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M3 7l9 4 9-4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3 7v10l9 4 9-4V7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z"
      />
    </svg>
  );
}

function AdminIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3l7 4v6c0 5-7 8-7 8s-7-3-7-8V7l7-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8v4l3 1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GruzchikIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 3h6l2 3h10v12H3z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </svg>
  );
}
