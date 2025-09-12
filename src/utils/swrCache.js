// Simple SWR-style cache with in-memory + localStorage fallback
// Key space is namespaced by siteUrl and user state to avoid collisions

const memoryCache = new Map();

const getNamespace = () => {
  const site = (window.nkReactTheme?.siteUrl || '').replace(/\/$/, '');
  const loggedIn = !!window.nkReactTheme?.isUserLoggedIn;
  return `${site}|${loggedIn ? 'auth' : 'anon'}`;
};

const nsKey = (key) => `${getNamespace()}::${key}`;

export function readCache(key) {
  const k = nsKey(key);
  if (memoryCache.has(k)) return memoryCache.get(k);
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    memoryCache.set(k, parsed);
    return parsed;
  } catch (_e) {
    return null;
  }
}

export function writeCache(key, value) {
  const k = nsKey(key);
  memoryCache.set(k, value);
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch (_e) {
    // ignore quota/private mode
  }
}

export function removeCache(key) {
  const k = nsKey(key);
  memoryCache.delete(k);
  try { localStorage.removeItem(k); } catch (_e) {}
}

export function nowTs() { return Date.now(); }

export function isExpired(ts, ttlMs) {
  if (!Number.isFinite(ts)) return true;
  return (Date.now() - ts) > ttlMs;
}
