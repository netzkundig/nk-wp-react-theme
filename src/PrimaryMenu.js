import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

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

const NavItem = ({ node, pathname, siteUrl }) => {
  const active = isActiveUrl(node.url, pathname, siteUrl);
  const cls = ['menu-item'];
  if (active) cls.push('is-active');
  if (node.attr?.classes) cls.push(node.attr.classes);
  if (node.children?.length) cls.push('has-children');
  return (
    <li className={cls.join(' ')}>
      <a href={node.url} target={node.attr?.target || undefined} rel={node.attr?.rel || undefined}>
        {node.title}
      </a>
      {node.children?.length ? (
        <ul className="sub-menu">
          {node.children.map(child => (
            <NavItem key={child.id} node={child} pathname={pathname} siteUrl={siteUrl} />
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
  const cacheKey = useMemo(() => `nk-menu:${LOCATION}:${siteUrl.replace(/\/$/, '')}`, [siteUrl]);
  const versionKey = useMemo(() => `nk-menu-version:${LOCATION}:${siteUrl.replace(/\/$/, '')}`, [siteUrl]);

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

  return (
    <div className="primary-menu__container">
    <nav className="primary-menu__nav" aria-label="Primary" aria-busy={busy ? 'true' : undefined}>
      {error ? (
        <div className="menu-error">{error}</div>
      ) : (
        <ul id="primary-menu" className="primary-menu">
          {tree.map(node => (
            <NavItem key={node.id} node={node} pathname={routerLocation.pathname} siteUrl={siteUrl} />
          ))}
        </ul>
      )}
    </nav>
    </div>
  );
};

export default PrimaryMenu;
