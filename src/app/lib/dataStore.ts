/** Module-level data store that deduplicates in-flight requests and caches results. */

const DEFAULT_TTL = 60_000; // 60 s

export interface DataStore<T> {
  get(): T | null;
  isFresh(): boolean;
  fetch(fetcher: () => Promise<T>): Promise<T>;
  subscribe(listener: () => void): () => void;
  invalidate(): void;
}

export function createDataStore<T>(ttl = DEFAULT_TTL): DataStore<T> {
  let data: T | null = null;
  let inflight: Promise<T> | null = null;
  let lastFetch = 0;
  const listeners = new Set<() => void>();

  return {
    get: () => data,
    isFresh: () => data !== null && Date.now() - lastFetch < ttl,
    fetch: (fetcher: () => Promise<T>): Promise<T> => {
      // Return cached data immediately if still fresh
      if (data !== null && Date.now() - lastFetch < ttl) return Promise.resolve(data);
      // Deduplicate: if a request is already in flight, share its promise
      if (inflight) return inflight;
      inflight = fetcher()
        .then(result => {
          data = result;
          lastFetch = Date.now();
          listeners.forEach(l => l());
          return result;
        })
        .finally(() => { inflight = null; });
      return inflight;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    invalidate: () => {
      data = null;
      lastFetch = 0;
    },
  };
}
