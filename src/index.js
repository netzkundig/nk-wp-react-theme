import * as wpElement from '@wordpress/element';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { setupLinkHoverPrefetch, setupViewportPrefetch } from './utils/prefetch';

const container = document.getElementById('app');
const bootstrap = window.nkReactTheme || {};

let basename = '/';
try {
  const raw = bootstrap?.siteUrl || window.location.origin + '/';
  const u = new URL(raw, window.location.origin);
  basename = u.pathname || '/';
} catch (_) { basename = '/'; }

// Expose basename for non-hook consumers (e.g., class components)
try { window.__NK_ROUTER_BASENAME = basename; } catch (_) {}

const appTree = wpElement.createElement(
  BrowserRouter,
  { basename },
  wpElement.createElement(App, { bootstrap })
);

if (!container) {
  console.error('Element mit ID "app" nicht gefunden.');
} else if (typeof wpElement.createRoot === 'function') {
  const root = wpElement.createRoot(container);
  root.render(appTree);
} else if (typeof wpElement.render === 'function') {
  wpElement.render(appTree, container);
} else {
  console.error('Weder createRoot noch render ist in @wordpress/element verfügbar.');
}

// Register Service Worker for offline + REST runtime cache (scope '/')
if ('serviceWorker' in navigator) {
  const params = new URLSearchParams(location.search);
  const swDisabled = (() => {
    try { return (localStorage.getItem('NK_SW_DISABLE') === '1') || params.has('no-sw'); } catch (_) { return params.has('no-sw'); }
  })();
  if (!swDisabled) {
    window.addEventListener('load', async () => {
      const tryRegister = async (url) => navigator.serviceWorker.register(url);
      // Probe with a HEAD request to avoid registering a URL that would redirect (Safari disallows)
      const probe = async () => {
        try {
          const basePath = (typeof window.__NK_ROUTER_BASENAME === 'string' && window.__NK_ROUTER_BASENAME) ? window.__NK_ROUTER_BASENAME : basename || '/';
          const swPath = (basePath.endsWith('/') ? basePath : basePath + '/') + 'sw.js';
          const res = await fetch(swPath, { method: 'HEAD', cache: 'no-store', redirect: 'manual' });
          if (res.status === 200) return swPath;
          // If redirect indicated or not 200, use query-var endpoint which we ensured doesn’t redirect
          const qv = (basePath.endsWith('/') ? basePath : basePath + '/') + '?service_worker=1';
          return qv;
        } catch (_) {
          const basePath = (typeof window.__NK_ROUTER_BASENAME === 'string' && window.__NK_ROUTER_BASENAME) ? window.__NK_ROUTER_BASENAME : basename || '/';
          const qv = (basePath.endsWith('/') ? basePath : basePath + '/') + '?service_worker=1';
          return qv;
        }
      };
      const url = await probe();
      try {
        await tryRegister(url);
      } catch (_) {
        // final no-op
      }
    });
  }
}

// Enable prefetching of likely next routes
let teardownHover, teardownViewport;
window.addEventListener('load', () => {
  teardownHover = setupLinkHoverPrefetch(document);
  teardownViewport = setupViewportPrefetch('a');
});
window.addEventListener('beforeunload', () => {
  if (typeof teardownHover === 'function') teardownHover();
  if (typeof teardownViewport === 'function') teardownViewport();
});
