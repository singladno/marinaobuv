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
 * Per-chat WA parser detail: redirect to the main parser detail page with sourceId
 * so history and status are filtered for this chat.
 */
export default function WaChatParserPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.chatId as string;

  useEffect(() => {
    if (!chatId) return;
    // Route param may be pre-encoded (e.g. 79296430333-1565970647%40g.us); decode first so we don't double-encode in query
    const decoded = tryDecodeUriComponent(chatId);
    router.replace(`/admin/parsing/wa?sourceId=${encodeURIComponent(decoded)}`);
  }, [chatId, router]);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <p className="text-sm text-gray-500">Перенаправление…</p>
    </div>
  );
}
