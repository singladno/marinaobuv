'use client';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface OldVersionLinkProps {
  className?: string;
  variant?: 'header' | 'standalone';
}

const OLD_VERSION_URL = 'https://www.marinaobuv.ru/';

export function OldVersionLink({
  className = '',
  variant = 'header',
}: OldVersionLinkProps) {
  const handleClick = () => {
    window.open(OLD_VERSION_URL, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'header') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`flex h-auto min-h-[2rem] flex-col items-center justify-center rounded-md border border-white/30 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-2 text-xs font-semibold !text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 hover:shadow-lg active:scale-100 md:h-7 md:flex-row md:px-2.5 ${className}`}
        aria-label="Перейти на старую версию сайта"
      >
        <span className="leading-tight md:leading-normal">Старая</span>
        <span className="leading-tight md:leading-normal md:ml-1">версия</span>
        <ArrowTopRightOnSquareIcon className="hidden h-3.5 w-3.5 flex-shrink-0 md:ml-1.5 md:inline" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="md"
      onClick={handleClick}
      className={`group flex items-center gap-2 transition-all duration-200 hover:shadow-md ${className}`}
      aria-label="Перейти на старую версию сайта"
    >
      <span className="font-medium">Перейти на старую версию</span>
      <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Button>
  );
}
