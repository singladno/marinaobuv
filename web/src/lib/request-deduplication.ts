// Request deduplication utility to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>();

export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // If there's already a pending request with this key, return it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  // Create new request and store it
  const request = requestFn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
}

export function clearPendingRequests() {
  pendingRequests.clear();
}
