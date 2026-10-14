const KEY = 'vq.clientId';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let cached: string | null = null;
let sessionFallback: string | null = null;

export function getClientId(): string {
  if (cached) return cached;
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && UUID_RE.test(stored)) {
      cached = stored;
      return cached;
    }
    const fresh = crypto.randomUUID();
    localStorage.setItem(KEY, fresh);
    cached = fresh;
    return cached;
  } catch {
    sessionFallback ??= crypto.randomUUID();
    cached = sessionFallback;
    return cached;
  }
}

/** Test-only: clears module-level caches. */
export function __resetClientIdForTests(): void {
  cached = null;
  sessionFallback = null;
}
