// Check env var or localStorage override for easier debugging
const getDebugFlag = () => {
  if (typeof window === 'undefined') return false;
  // Check localStorage first for quick toggle (dev convenience)
  const localOverride = localStorage.getItem('DEBUG_LOGS');
  if (localOverride === '1' || localOverride === 'true') return true;
  // Check env var
  return process.env.NEXT_PUBLIC_DEBUG_LOGS === '1';
};
const DEBUG = getDebugFlag();

function ts() {
  return new Date().toISOString();
}

export const log = {
  group(title: string, ...rest: any[]) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.group(`[${ts()}] ${title}`, ...rest);
  },
  groupEnd() {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.groupEnd();
  },
  info(title: string, data?: any) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.log(`[${ts()}]`, title, data ?? '');
  },
  warn(title: string, data?: any) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.warn(`[${ts()}]`, title, data ?? '');
  },
  error(title: string, data?: any) {
    // Always print errors
    // eslint-disable-next-line no-console
    console.error(`[${ts()}]`, title, data ?? '');
  },
};