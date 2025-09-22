// Intercept internal <a> clicks inside a container to use React Router navigation.
// Preserves modifier/middle clicks and external links; respects target attributes.

export function setupLinkInterception(container, navigate, options = {}) {
  if (!container || typeof container.addEventListener !== 'function') return () => {};
  const siteUrl = (window.nkReactTheme?.siteUrl) || '/';
  const sameOrigin = (href) => {
    try { const u = new URL(href, siteUrl); const b = new URL(siteUrl); return u.origin === b.origin; } catch { return false; }
  };
  const toPath = (href) => {
    try { const u = new URL(href, siteUrl); return (u.pathname || '/') + (u.search || '') + (u.hash || ''); } catch { return '/'; }
  };
  const onClick = (e) => {
    if (e.defaultPrevented) return;
    // Only left-click
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    // target=_blank or download should be handled by browser
    const target = a.getAttribute('target');
    if (target && target.toLowerCase() === '_blank') return;
    if (a.hasAttribute('download')) return;
    // Respect rel=noopener/noreferrer - still fine, but if target is blank we already returned
    // External links pass through
    if (!sameOrigin(href)) return;
    const path = toPath(href);
    // Hash-only navigation within same path - let browser handle for scroll-behavior
    try {
      const current = new URL(window.location.href);
      const dest = new URL(href, siteUrl);
      if (current.pathname === dest.pathname && current.search === dest.search && dest.hash) return;
    } catch {}
    e.preventDefault();
    navigate(path);
  };
  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}
