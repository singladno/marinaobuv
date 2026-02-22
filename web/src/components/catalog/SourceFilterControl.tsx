'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Hand } from 'lucide-react';

import { AggregatorIcon } from '@/components/icons/AggregatorIcon';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { useUser } from '@/contexts/NextAuthUserContext';
import type { CatalogSourceItem } from '@/app/api/catalog/sources/route';

interface SourceFilterControlProps {
  value: string[];
  sources: CatalogSourceItem[];
  onChange: (sourceIds: string[]) => void;
  onClear: () => void;
  loading?: boolean;
}

function SourceIcon({ type }: { type: CatalogSourceItem['type'] }) {
  if (type === 'WA') {
    return (
      <Image
        src="/images/whatsapp-icon.png"
        alt="WhatsApp"
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded"
        unoptimized
      />
    );
  }
  if (type === 'TG') {
    return (
      <Image
        src="/images/telegram-icon.png"
        alt="Telegram"
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded"
        unoptimized
      />
    );
  }
  if (type === 'AG') {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <AggregatorIcon className="h-5 w-5" />
      </span>
    );
  }
  if (type === 'MANUAL') {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-purple-500/80">
        <Hand className="h-5 w-5" strokeWidth={1.5} />
      </span>
    );
  }
  return null;
}

export function SourceFilterControl({
  value,
  sources,
  onChange,
  onClear,
  loading = false,
}: SourceFilterControlProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const hasSelection = value.length > 0;

  const toggle = useCallback(
    (id: string) => {
      if (value.includes(id)) {
        onChange(value.filter((x) => x !== id));
      } else {
        onChange([...value, id]);
      }
    },
    [value, onChange]
  );

  if (!isAdmin || sources.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`h-9 rounded-xl border-gray-200 shadow-sm hover:bg-gray-100 ${
            hasSelection
              ? 'border-purple-300 bg-purple-100 text-purple-700'
              : 'bg-gray-50 text-gray-700'
          }`}
          disabled={loading}
        >
          <span className="flex items-center gap-2">
            Источники
            {hasSelection && (
              <span className="rounded-full bg-purple-200/80 px-1.5 py-0.5 text-xs">
                {value.length}
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[320px] w-72 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
          {sources.map((source) => (
            <label
              key={source.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100"
            >
              <Checkbox
                checked={value.includes(source.id)}
                onCheckedChange={() => toggle(source.id)}
              />
              <SourceIcon type={source.type} />
              <span className="truncate text-sm">{source.name}</span>
            </label>
          ))}
        </div>
        {hasSelection && (
          <div className="mt-2 border-t border-gray-200 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Сбросить
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
