// Lightweight prefetch helpers for same-origin JSON endpoints and pages

const sameOrigin = (url) => {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin;
  } catch (_e) { return false; }
};

export function prefetchJson(url, opts = {}) {
  if (!sameOrigin(url)) return;
  if (navigator.connection && navigator.connection.saveData) return; // respect data saver
  return fetch(url, { credentials: 'same-origin', ...opts }).catch(() => {});
}

async function fetchJson(url) {
  if (!sameOrigin(url)) return null;
  if (navigator.connection && navigator.connection.saveData) return null;
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null;
    return await res.json();
  } catch (_e) { return null; }
}

const dedupe = new Set(); // avoid duplicate prefetch for same path in quick succession

async function prefetchRoute(base, path) {
  if (navigator.connection && navigator.connection.saveData) return;
  const key = `${base}::${path}`;
  if (dedupe.has(key)) return;
  dedupe.add(key);
  const resolveUrl = `${base}/wp-json/nk/v1/resolve?path=${encodeURIComponent(path)}`;
  // 1) Warm resolver endpoint
  const resolved = await fetchJson(resolveUrl);
  if (!resolved) { dedupe.delete(key); return; }
  // 2) Prefetch concrete resource
  let resourceUrl = null;
  if (resolved.type === 'page' || resolved.type === 'front-page') {
    resourceUrl = `${base}/wp-json/wp/v2/pages/${resolved.id}`;
  } else if (resolved.type === 'post') {
    resourceUrl = `${base}/wp-json/wp/v2/posts/${resolved.id}`;
  }
  if (resourceUrl) await prefetchJson(resourceUrl);
  dedupe.delete(key);
}

export function setupLinkHoverPrefetch(container = document) {
  const onHover = (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (!sameOrigin(a.href)) return;
    // Heuristic: prefetch resolver for that path
    const base = (window.nkReactTheme?.siteUrl || '').replace(/\/$/, '');
    const path = new URL(a.href, base).pathname || '/';
    // Debounced prefetch
    clearTimeout(a.__pf_to);
    a.__pf_to = setTimeout(() => prefetchRoute(base, path), 150);
  };
  container.addEventListener('mouseover', onHover);
  container.addEventListener('focusin', onHover);
  return () => {
    container.removeEventListener('mouseover', onHover);
    container.removeEventListener('focusin', onHover);
  };
}

export function setupViewportPrefetch(linkSelector = 'a') {
  if (!('IntersectionObserver' in window)) return () => {};
  const base = (window.nkReactTheme?.siteUrl || '').replace(/\/$/, '');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const a = entry.target;
      if (!(a instanceof HTMLAnchorElement)) continue;
      if (!sameOrigin(a.href)) continue;
      const path = new URL(a.href, base).pathname || '/';
      prefetchRoute(base, path);
      io.unobserve(a);
    }
  }, { rootMargin: '200px' });

  const links = document.querySelectorAll(linkSelector);
  links.forEach((a) => io.observe(a));
  return () => io.disconnect();
}
