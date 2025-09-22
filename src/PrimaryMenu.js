import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useHref } from 'react-router-dom';
import { useResolvePath } from './utils/wpSWR';

const buildTree = (items) => {
  const byId = new Map(items.map(i => [String(i.id), { ...i, children: [] }]));
  const roots = [];
  byId.forEach(node => {
    const parentId = String(node.parent || '0');
    if (parentId !== '0' && byId.has(parentId)) {
      byId.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

const isActiveUrl = (href, pathname, siteUrl) => {
  try {
    const u = new URL(href, siteUrl);
    const base = new URL(siteUrl);
    if (u.origin !== base.origin) return false;
    return u.pathname.replace(/\/$/, '') === pathname.replace(/\/$/, '');
  } catch (e) {
    return false;
  }
};

// Determine whether a menu URL is internal (same-origin) relative to siteUrl
const isInternalUrl = (href, siteUrl, explicitIsExternal) => {
  if (typeof explicitIsExternal === 'boolean') return !explicitIsExternal;
  try {
    const u = new URL(href, siteUrl);
    const base = new URL(siteUrl);
    return u.origin === base.origin;
  } catch (_e) {
    return false;
  }
};

// Convert an absolute URL into a router-relative path (/path?query#hash)
const toRouterPath = (href, siteUrl) => {
  try {
    const u = new URL(href, siteUrl);
    return (u.pathname || '/') + (u.search || '') + (u.hash || '');
  } catch (_e) {
    return '/';
  }
};

// Internal Link that preserves middle/ctrl/cmd click behavior (opens in new tab)
const InternalNavLink = ({ to, children, rel, target, className, style, ...rest }) => {
  const navigate = useNavigate();
  const href = useHref(to);
  const onClick = (e) => {
    // If target requests a new browsing context, let the browser handle it
    if (target === '_blank') {
      return;
    }
    // Let the browser handle if default already prevented or it's not a plain left click
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey || e.ctrlKey || e.altKey || e.shiftKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };
  const relSecure = target === '_blank' ? ['noopener', 'noreferrer'] : [];
  const relFinal = [rel, ...relSecure].filter(Boolean).join(' ') || undefined;
  return (
    <a href={href} onClick={onClick} rel={relFinal} target={target} className={className} style={style} {...rest}>
      {children}
    </a>
  );
};

const NavItem = ({ node, pathname, siteUrl, selfSet, parentSet, ancestorSet }) => {
  const active = isActiveUrl(node.url, pathname, siteUrl);
  const cls = ['menu-item'];
  if (active) cls.push('is-active');
  if (node.attr?.classes) cls.push(node.attr.classes);
  if (node.children?.length) cls.push('has-children');
  const internal = isInternalUrl(node.url, siteUrl, node.isExternal);
  const to = internal ? toRouterPath(node.url, siteUrl) : null;
  // WP-like active classes based on route/object matching
  const idKey = String(node.id);
  const isSelf = selfSet?.has(idKey);
  const isParent = parentSet?.has(idKey);
  const isAncestor = ancestorSet?.has(idKey);
  if (isSelf) {
    cls.push('current-menu-item');
    if (node.object === 'page') cls.push('current_page_item');
  }
  if (isParent) {
    cls.push('current-menu-parent', 'current-menu-ancestor');
    if (node.object === 'page') cls.push('current_page_parent', 'current_page_ancestor');
  }
  if (isAncestor) {
    cls.push('current-menu-ancestor');
    if (node.object === 'page') cls.push('current_page_ancestor');
  }
  const hasChildren = !!node.children?.length;
  const ariaCurrent = isSelf ? 'page' : undefined;
  const ariaExpanded = hasChildren && (isSelf || isParent || isAncestor) ? 'true' : undefined;
  return (
    <li className={cls.join(' ')}>
      {internal ? (
        <InternalNavLink to={to} rel={node.attr?.rel || undefined} target={node.attr?.target || undefined} aria-current={ariaCurrent} aria-haspopup={hasChildren ? 'true' : undefined} aria-expanded={ariaExpanded}>
          {node.title}
        </InternalNavLink>
      ) : (
        <a href={node.url} target={node.attr?.target || undefined} rel={node.attr?.rel || undefined} aria-current={ariaCurrent} aria-haspopup={hasChildren ? 'true' : undefined} aria-expanded={ariaExpanded}>
          {node.title}
        </a>
      )}
      {node.children?.length ? (
        <ul className="sub-menu">
          {node.children.map(child => (
            <NavItem key={child.id} node={child} pathname={pathname} siteUrl={siteUrl} selfSet={selfSet} parentSet={parentSet} ancestorSet={ancestorSet} />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

const PrimaryMenu = () => {
  const [error, setError] = useState(null);
  const routerLocation = useLocation();
  const siteUrl = (window.nkReactTheme?.siteUrl) || '/';
  const isLoggedIn = !!window.nkReactTheme?.isUserLoggedIn;
  const LOCATION = 'primary';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
  const cacheKey = useMemo(() => `nk-menu:${LOCATION}:${siteUrl.replace(/\/$/, '')}:${isLoggedIn ? 'auth' : 'anon'}`, [siteUrl, isLoggedIn]);
  const versionKey = useMemo(() => `nk-menu-version:${LOCATION}:${siteUrl.replace(/\/$/, '')}:${isLoggedIn ? 'auth' : 'anon'}`, [siteUrl, isLoggedIn]);

  // Returns cache content incl. expired flag in order to also render expired (stale) data initially.
  const readCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      const ts = Number(parsed.ts || 0);
      const expired = Number.isFinite(ts) ? (Date.now() - ts > CACHE_TTL_MS) : true;
      return { items: parsed.items, expired };
    } catch (_e) {
      return null;
    }
  };

  const writeCache = (data, version) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ items: data, ts: Date.now() }));
      if (version) localStorage.setItem(versionKey, version);
    } catch (_e) {
      // ignore quota or privacy mode errors
    }
  };

  const fetchVersion = async () => {
    try {
      const res = await fetch(`/wp-json/nk/v1/menu-version/${LOCATION}`, { credentials: 'same-origin' });
      const json = await res.json();
      return json?.version || null;
    } catch (_e) {
      return null;
    }
  };

  const fetchMenu = async () => {
    const r = await fetch(`/wp-json/nk/v1/menu/${LOCATION}`, { credentials: 'same-origin' });
    const json = await r.json();
    return Array.isArray(json.items) ? json.items : [];
  };

  // Initial hydrogenation from cache (even if expired) to avoid flickering
  const initialCache = useMemo(() => readCache(), [cacheKey]);
  const initialItems = initialCache?.items || [];
  const hadCache = initialItems.length > 0;
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(!hadCache); // Only show real loading if we had no cache
  const [revalidating, setRevalidating] = useState(false); // Background refresh without UI flickering

  useEffect(() => {
    let active = true;
    const run = async () => {
      // For logged out users: check version first; leave cache if identical
      let serverVersion = null;
      const cachedVersion = localStorage.getItem(versionKey);
      if (!isLoggedIn) {
        serverVersion = await fetchVersion();
        if (!active) return;
        if (serverVersion && cachedVersion && serverVersion === cachedVersion && hadCache) {
          // Cache is up to date: do nothing further
          setLoading(false);
          return;
        }
      }

      // Otherwise reload; if we had cache, just revalidate (without hiding UI)
      if (hadCache) {
        setRevalidating(true);
      } else {
        setLoading(true);
      }
      try {
        const data = await fetchMenu();
        if (!active) return;
        setItems(data);
        if (!isLoggedIn) writeCache(data, serverVersion);
      } catch (_e) {
        if (active) setError('Menu could not be loaded');
      } finally {
        if (!active) return;
        if (hadCache) {
          setRevalidating(false);
        } else {
          setLoading(false);
        }
      }
    };

    run();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, versionKey, isLoggedIn]);

  const tree = useMemo(() => buildTree(items), [items]);

  const busy = loading || revalidating;

  // Keyboard navigation for menu (Arrow keys, Home/End, Escape)
  const navRef = useRef(null);
  const onKeyDown = (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'ArrowRight', 'ArrowLeft', 'Escape'];
    if (!keys.includes(e.key)) return;
    const root = navRef.current;
    if (!root) return;
    const links = root.querySelectorAll('a');
    if (!links.length) return;
    const active = document.activeElement;
    let idx = Array.prototype.indexOf.call(links, active);
    const focusAt = (i) => { if (links[i]) links[i].focus(); };
    switch (e.key) {
      case 'Home': e.preventDefault(); focusAt(0); break;
      case 'End': e.preventDefault(); focusAt(links.length - 1); break;
      case 'ArrowDown': e.preventDefault(); focusAt(Math.min(links.length - 1, Math.max(0, idx + 1))); break;
      case 'ArrowUp': e.preventDefault(); focusAt(Math.min(links.length - 1, Math.max(0, idx - 1))); break;
      case 'ArrowRight': e.preventDefault(); focusAt(Math.min(links.length - 1, Math.max(0, idx + 1))); break;
      case 'ArrowLeft': e.preventDefault(); focusAt(Math.min(links.length - 1, Math.max(0, idx - 1))); break;
      case 'Escape': if (active && active instanceof HTMLElement) { active.blur(); } break;
      default: break;
    }
  };

  // Resolve current route (cached via SWR) to mirror WP active classes
  const { data: route } = useResolvePath(routerLocation.pathname || '/');
  const blogPageId = window.nkReactTheme?.blogPageId ? Number(window.nkReactTheme.blogPageId) : null;

  // Build parent map for ancestor propagation
  const parentMap = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(String(it.id), String(it.parent || '0'));
    return m;
  }, [items]);

  // Compute matching self items based on route or URL equality
  const { selfSet, parentSet, ancestorSet } = useMemo(() => {
    const self = new Set();
    const parent = new Set();
    const ancestor = new Set();
    const curPath = routerLocation.pathname.replace(/\/$/, '') || '/';
    for (const it of items) {
      let matches = false;
      // URL-based match for internal links
      const internal = isInternalUrl(it.url, siteUrl, it.isExternal);
      if (internal) {
        const p = toRouterPath(it.url, siteUrl).replace(/\/$/, '');
        if (p === curPath) matches = true;
      }
      // Route-based match for WP objects
      if (!matches && route) {
        const objId = Number(it.objectId || 0);
        const obj = String(it.object || '');
        if ((route.type === 'page' || route.type === 'front-page') && obj === 'page' && objId === Number(route.id || 0)) {
          matches = true;
        } else if (route.type === 'home' && blogPageId && obj === 'page' && objId === blogPageId) {
          matches = true;
        } else if (route.type === 'post' && obj === 'post' && objId === Number(route.id || 0)) {
          matches = true;
        }
      }
      if (matches) {
        const k = String(it.id);
        self.add(k);
        // propagate to parent/ancestors
        let pid = parentMap.get(k);
        if (pid && pid !== '0') {
          parent.add(pid);
          ancestor.add(pid);
          let g = parentMap.get(pid);
          while (g && g !== '0') { ancestor.add(g); g = parentMap.get(g); }
        }
      }
    }
    return { selfSet: self, parentSet: parent, ancestorSet: ancestor };
  }, [items, route, blogPageId, routerLocation.pathname, siteUrl, parentMap]);

  return (
    <div className="primary-menu__container">
  <nav className="primary-menu__nav" aria-label="Primary" aria-busy={busy ? 'true' : undefined} ref={navRef} onKeyDown={onKeyDown}>
      {error ? (
        <div className="menu-error">{error}</div>
      ) : (
        <ul id="primary-menu" className="primary-menu">
          {tree.map(node => (
            <NavItem key={node.id} node={node} pathname={routerLocation.pathname} siteUrl={siteUrl} selfSet={selfSet} parentSet={parentSet} ancestorSet={ancestorSet} />
          ))}
        </ul>
      )}
    </nav>
    </div>
  );
};

export default PrimaryMenu;
