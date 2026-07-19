'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

function tryDecodeUriComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Per-channel TG parser detail: redirect to the main parser detail page with sourceId.
 */
export default function TgChannelParserPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params?.channelId as string;

  useEffect(() => {
    if (!channelId) return;
    const decoded = tryDecodeUriComponent(channelId);
    router.replace(`/admin/parsing/tg?sourceId=${encodeURIComponent(decoded)}`);
  }, [channelId, router]);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <p className="text-sm text-gray-500">Перенаправление…</p>
    </div>
  );
}
