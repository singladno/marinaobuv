import Link from 'next/link';

import { Button } from '@/components/ui/Button';

interface ProfileMenuContentProps {
  user: {
    userId: string;
    phone?: string;
    name?: string | null;
  } | null;
  onLogout?: () => void;
  loading?: boolean;
}

export default function ProfileMenuContent({
  user,
  onLogout,
  loading,
}: ProfileMenuContentProps) {
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
            {user?.phone || ''}
          </div>
        </div>
      </div>

      <nav className="p-2">
        <MenuItem href="/orders" icon={BoxIcon} label="Заказы" />
        <MenuItem href="/favorites" icon={HeartIcon} label="Избранное" />
      </nav>

      <div className="border-t border-gray-100 p-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLogout}
          disabled={loading}
        >
          {loading ? 'Выходим…' : 'Выйти'}
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
