/**
 * Persist WhatsApp admin inbox list + per-thread messages in IndexedDB
 * for instant render after reopen / refresh; network updates apply on top.
 */

const DB_NAME = 'marinaobuv-wa-inbox';
const STORE = 'kv';
const DB_VERSION = 1;

const KEY_CHATS = 'chats-list';

function threadKey(chatId: string): string {
  return `thread:${chatId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export async function waInboxIdbGetChats<T>(): Promise<T[] | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const st = tx.objectStore(STORE);
      const g = st.get(KEY_CHATS);
      g.onerror = () => reject(g.error);
      g.onsuccess = () => {
        const v = g.result;
        if (v == null) {
          resolve(null);
          return;
        }
        try {
          const parsed = JSON.parse(String(v)) as unknown;
          resolve(Array.isArray(parsed) ? (parsed as T[]) : null);
        } catch {
          resolve(null);
        }
      };
    });
  } catch {
    return null;
  }
}

export async function waInboxIdbPutChats<T>(chats: T[]): Promise<void> {
  try {
    const db = await openDb();
    const raw = JSON.stringify(chats);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const p = st.put(raw, KEY_CHATS);
      p.onerror = () => reject(p.error);
      p.onsuccess = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

export type WaInboxCachedThread<TMsg = unknown> = {
  messages: TMsg[];
  readThroughTs: number;
  savedAt: number;
};

export async function waInboxIdbGetThread<TMsg>(
  chatId: string
): Promise<WaInboxCachedThread<TMsg> | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const st = tx.objectStore(STORE);
      const g = st.get(threadKey(chatId));
      g.onerror = () => reject(g.error);
      g.onsuccess = () => {
        const v = g.result;
        if (v == null) {
          resolve(null);
          return;
        }
        try {
          const parsed = JSON.parse(String(v)) as WaInboxCachedThread<TMsg>;
          if (
            parsed &&
            Array.isArray(parsed.messages) &&
            typeof parsed.readThroughTs === 'number'
          ) {
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
    });
  } catch {
    return null;
  }
}

export async function waInboxIdbPutThread<TMsg>(
  chatId: string,
  payload: { messages: TMsg[]; readThroughTs: number }
): Promise<void> {
  try {
    const db = await openDb();
    const body: WaInboxCachedThread<TMsg> = {
      messages: payload.messages,
      readThroughTs: payload.readThroughTs,
      savedAt: Date.now(),
    };
    const raw = JSON.stringify(body);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const p = st.put(raw, threadKey(chatId));
      p.onerror = () => reject(p.error);
      p.onsuccess = () => resolve();
    });
  } catch {
    /* ignore */
  }
}
