const KEY = 'vq.clientId';
const VALID = /^[A-Za-z0-9-]{8,64}$/; // same rule as the API's X-Client-Id check

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Very old browsers and non-HTTPS pages have no randomUUID.
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/** Used when localStorage is blocked (private mode, strict settings): the id then lasts until the tab closes. */
let sessionId: string | null = null;

/** The visitor's anonymous id. The API uses it so each visitor only sees their own conversations. */
export function getClientId(): string {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && VALID.test(stored)) return stored;
    const fresh = sessionId ?? randomId();
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    sessionId ??= randomId();
    return sessionId;
  }
}
