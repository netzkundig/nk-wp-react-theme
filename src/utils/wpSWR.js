import { readCache, writeCache, isExpired, nowTs } from './swrCache';
import { useEffect, useMemo, useState } from 'react';

// Generic SWR hook for a single WP REST resource
// Options: { ttlMs, makeKey, fetcher, versionOf }
export function useSWRResource(key, { ttlMs = 24 * 60 * 60 * 1000, fetcher, versionOf }) {
  // initial from cache (even if expired) to avoid flicker
  const initial = useMemo(() => readCache(key), [key]);
  const hadCache = !!initial?.data;
  const [data, setData] = useState(initial?.data || null);
  const [loading, setLoading] = useState(!hadCache);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      // compare version if available
      const cachedVersion = initial?.version || null;
      const expired = !hadCache || isExpired(initial?.ts, ttlMs);

      // If we have cache and not expired, we still may revalidate silently.
      // If expired or no cache, show loading state.
      if (hadCache) setRevalidating(true); else setLoading(true);

      try {
        const fresh = await fetcher();
        if (!active) return;
        const freshVersion = versionOf ? versionOf(fresh) : null;
        // Only update if data is new/different or no cache
        const shouldUpdate = !hadCache || (freshVersion && freshVersion !== cachedVersion);
        if (shouldUpdate) {
          setData(fresh);
        }
        writeCache(key, { data: fresh, version: freshVersion, ts: nowTs() });
      } catch (e) {
        if (active) setError('Konnte Daten nicht laden');
      } finally {
        if (!active) return;
        if (hadCache) setRevalidating(false); else setLoading(false);
      }
    };

    // Revalidate always when key changes; if we had cache and not expired, UI won't flicker
    run();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, revalidating, error };
}

// Helpers for WordPress specific resources
function siteBase() {
  return (window.nkReactTheme?.siteUrl || '').replace(/\/$/, '');
}

const jsonOrThrow = async (res) => {
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

function versionFromEntity(entity) {
  // Use modified_gmt if available, fallback to id + date
  return entity?.modified_gmt || `${entity?.id || ''}:${entity?.date_gmt || ''}`;
}

export function useWPPage(id, { ttlMs = 24 * 60 * 60 * 1000 } = {}) {
  const key = `wp:page:${id}`;
  return useSWRResource(key, {
    ttlMs,
    fetcher: async () => {
      const base = siteBase();
      return jsonOrThrow(await fetch(`${base}/wp-json/wp/v2/pages/${id}`, { credentials: 'same-origin' }));
    },
    versionOf: versionFromEntity,
  });
}

export function useWPPost(id, { ttlMs = 24 * 60 * 60 * 1000 } = {}) {
  const key = `wp:post:${id}`;
  return useSWRResource(key, {
    ttlMs,
    fetcher: async () => {
      const base = siteBase();
      return jsonOrThrow(await fetch(`${base}/wp-json/wp/v2/posts/${id}`, { credentials: 'same-origin' }));
    },
    versionOf: versionFromEntity,
  });
}

export function useResolvePath(path, { ttlMs = 10 * 60 * 1000 } = {}) {
  const key = `wp:resolve:${path}`;
  return useSWRResource(key, {
    ttlMs,
    fetcher: async () => {
      const base = siteBase();
      return jsonOrThrow(await fetch(`${base}/wp-json/nk/v1/resolve?path=${encodeURIComponent(path)}`, { credentials: 'same-origin' }));
    },
    versionOf: (r) => `${r?.type || ''}:${r?.id || ''}`, // changes when mapping changes
  });
}
