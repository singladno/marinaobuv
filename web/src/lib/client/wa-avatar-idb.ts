/**
 * Persistent client-side cache for WhatsApp avatars (IndexedDB + session Map).
 * Session map: instant display on remount without awaiting IDB / network.
 */

const DB_NAME = 'marinaobuv-wa-avatars';
const STORE = 'avatarBlobs';
const STORE_MISSING = 'avatarMissing';
const DB_VERSION = 2;

/** In-memory blobs for current tab — same device, instant reuse. */
const sessionBlobs = new Map<string, Blob>();
/** Сервер вернул 404 — не дергать `/avatar` повторно до смены ревизии. */
const sessionMissing = new Set<string>();

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
      if (!db.objectStoreNames.contains(STORE_MISSING)) {
        db.createObjectStore(STORE_MISSING);
      }
    };
  });
}

/** Синхронно: уже есть в памяти этой вкладки (без ожидания IDB). */
export function waAvatarPeekSession(chatId: string): Blob | null {
  const b = sessionBlobs.get(chatId);
  return b && b.size > 0 ? b : null;
}

/** Синхронно: уже известно, что для чата нет картинки (сессия). */
export function waAvatarPeekMissing(chatId: string): boolean {
  return sessionMissing.has(chatId);
}

/** Есть ли в IndexedDB отметка «аватар недоступен (404)». */
export async function waAvatarIdbGetMissing(chatId: string): Promise<boolean> {
  if (sessionMissing.has(chatId)) return true;
  try {
    const db = await openDb();
    const v = await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_MISSING, 'readonly');
      const st = tx.objectStore(STORE_MISSING);
      const g = st.get(chatId);
      g.onerror = () => reject(g.error);
      g.onsuccess = () => resolve(g.result === true);
    });
    if (v) sessionMissing.add(chatId);
    return v;
  } catch {
    return false;
  }
}

export async function waAvatarIdbPutMissing(chatId: string): Promise<void> {
  sessionMissing.add(chatId);
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MISSING, 'readwrite');
      const st = tx.objectStore(STORE_MISSING);
      const p = st.put(true, chatId);
      p.onerror = () => reject(p.error);
      p.onsuccess = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

export async function waAvatarIdbClearMissing(chatId: string): Promise<void> {
  sessionMissing.delete(chatId);
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MISSING, 'readwrite');
      const st = tx.objectStore(STORE_MISSING);
      const p = st.delete(chatId);
      p.onerror = () => reject(p.error);
      p.onsuccess = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

export async function waAvatarIdbGet(chatId: string): Promise<Blob | null> {
  const mem = waAvatarPeekSession(chatId);
  if (mem) return mem;
  try {
    const db = await openDb();
    const fromDb = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const st = tx.objectStore(STORE);
      const g = st.get(chatId);
      g.onerror = () => reject(g.error);
      g.onsuccess = () => {
        const v = g.result;
        resolve(v instanceof Blob ? v : null);
      };
    });
    if (fromDb && fromDb.size > 0) {
      sessionBlobs.set(chatId, fromDb);
      void waAvatarIdbClearMissing(chatId);
    }
    return fromDb;
  } catch {
    return null;
  }
}

/** Base64 (без префикса data:) из bootstrap → Blob для IndexedDB. */
export function waAvatarBlobFromBase64(b64: string): Blob | null {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const isPng =
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;
    const type = isPng ? 'image/png' : 'image/jpeg';
    return new Blob([bytes], { type });
  } catch {
    return null;
  }
}

export async function waAvatarIdbPut(chatId: string, blob: Blob): Promise<void> {
  if (blob.size > 0) {
    sessionBlobs.set(chatId, blob);
    void waAvatarIdbClearMissing(chatId);
  }
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const p = st.put(blob, chatId);
      p.onerror = () => reject(p.error);
      p.onsuccess = () => resolve();
    });
  } catch {
    /* ignore quota / private mode */
  }
}

export async function waAvatarIdbDelete(chatId: string): Promise<void> {
  sessionBlobs.delete(chatId);
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const p = st.delete(chatId);
      p.onerror = () => reject(p.error);
      p.onsuccess = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

const AVATAR_JPEG_QUALITY = 0.88;
const AVATAR_MAX_EDGE_PX = 192;

/**
 * Сохраняет уже декодированное изображение с same-origin `<img>` без второго HTTP-запроса.
 */
export function waAvatarPersistFromDecodedImage(
  img: HTMLImageElement,
  chatId: string
): void {
  if (img.naturalWidth < 1 || img.naturalHeight < 1) return;
  const canvas = document.createElement('canvas');
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > AVATAR_MAX_EDGE_PX || h > AVATAR_MAX_EDGE_PX) {
    const scale = AVATAR_MAX_EDGE_PX / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  try {
    ctx.drawImage(img, 0, 0, w, h);
  } catch {
    return;
  }
  canvas.toBlob(
    blob => {
      if (blob && blob.size > 0) {
        void waAvatarIdbPut(chatId, blob);
      }
    },
    'image/jpeg',
    AVATAR_JPEG_QUALITY
  );
}
