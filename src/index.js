import * as wpElement from '@wordpress/element';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { setupLinkHoverPrefetch, setupViewportPrefetch } from './utils/prefetch';

const container = document.getElementById('app');
const bootstrap = window.nkReactTheme || {};

const appTree = wpElement.createElement(
  BrowserRouter,
  null,
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
  // Avoid in some dev contexts (e.g., localhost) unless desired
  const isLocalhost = /^(localhost|127\.|\[::1\])/.test(location.hostname);
  if (!isLocalhost) {
    window.addEventListener('load', async () => {
      const tryRegister = async (url) => navigator.serviceWorker.register(url);
      // Probe with a HEAD request to avoid registering a URL that would redirect (Safari disallows)
      const probe = async () => {
        try {
          const res = await fetch('/sw.js', { method: 'HEAD', cache: 'no-store', redirect: 'manual' });
          if (res.status === 200) return '/sw.js';
          // If redirect indicated or not 200, use query-var endpoint which we ensured doesn’t redirect
          return '/?service_worker=1';
        } catch (_) {
          return '/?service_worker=1';
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
