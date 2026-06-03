interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`gitdoc:${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(`gitdoc:${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    localStorage.setItem(`gitdoc:${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function cacheClear(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("gitdoc:"));
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
