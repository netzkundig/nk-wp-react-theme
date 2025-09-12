<?php
/**
 * Service Worker output for NK React Theme
 */

function nkreact_register_sw_rewrite() {
    add_rewrite_rule('^sw\.js$', 'index.php?service_worker=1', 'top');
}
add_action('init', 'nkreact_register_sw_rewrite');

function nkreact_sw_query_var($vars) {
    $vars[] = 'service_worker';
    return $vars;
}
add_filter('query_vars', 'nkreact_sw_query_var');

function nkreact_output_service_worker() {
    if (!get_query_var('service_worker')) {
        return;
    }
    $site  = home_url('/');
    $theme = get_template_directory_uri();
    $ver   = '1.0.0';

    nocache_headers();
    header('Content-Type: application/javascript; charset=UTF-8');
    echo "\n";
    ?>
// NK React Theme Service Worker
// Scope: '/'
const SW_VERSION = '<?php echo esc_js($ver); ?>';
const SITE_URL = '<?php echo esc_url_raw($site); ?>'.replace(/\/$/, '') + '/';
const THEME_URL = '<?php echo esc_url_raw($theme); ?>'.replace(/\/$/, '');
const REST_PREFIX = SITE_URL + 'wp-json/';

const PRECACHE = 'nk-precache-' + SW_VERSION;
const RUNTIME = 'nk-runtime-' + SW_VERSION;

const PRECACHE_URLS = [
  THEME_URL + '/build/index.js',
  THEME_URL + '/style.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => null)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (!k.includes(SW_VERSION)) return caches.delete(k);
      return Promise.resolve(true);
    }))).then(() => self.clients.claim())
  );
});

function isAssetRequest(req) {
  try {
    const u = new URL(req.url);
    return u.href.startsWith(THEME_URL + '/build/') || u.href === THEME_URL + '/style.css';
  } catch (_e) { return false; }
}

function isRestGet(req) {
  return req.method === 'GET' && req.url.indexOf(REST_PREFIX) === 0;
}

// CacheFirst for theme assets, SWR for REST GET
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (isAssetRequest(req)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(PRECACHE).then((c) => c.put(req, clone));
          return res;
        }).catch(() => cached || Response.error());
      })
    );
    return;
  }

  if (isRestGet(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const fetchAndUpdate = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      // If we have cache, return it immediately and update in background
      if (cached) {
        event.waitUntil(fetchAndUpdate);
        return cached;
      }
      // No cache: go to network
      const net = await fetchAndUpdate;
      return net || new Response(null, { status: 503, statusText: 'Offline' });
    })());
    return;
  }
});
<?php
    exit;
}
add_action('template_redirect', 'nkreact_output_service_worker');

// Ensure rewrite rules are flushed on theme activation so /sw.js works without manual permalink save
add_action('after_switch_theme', function () {
  if (function_exists('nkreact_register_sw_rewrite')) {
    nkreact_register_sw_rewrite();
  }
  flush_rewrite_rules();
});
