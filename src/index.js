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
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // ignore registration failures silently
      });
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
