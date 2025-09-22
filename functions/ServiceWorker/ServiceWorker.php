<?php
/**
 * Service Worker module (namespaced)
 *
 * @package nk-react
 * @license GPL-2.0-or-later
 */

namespace NkReact\Theme\ServiceWorker;

class ServiceWorker
{
    public static function register(): void
    {
        \add_action('init', [self::class, 'register_sw_rewrite']);
        \add_filter('query_vars', [self::class, 'sw_query_var']);
        \add_filter('redirect_canonical', [self::class, 'disable_canonical_for_sw'], 10, 2);
        \add_action('template_redirect', [self::class, 'output_service_worker']);
        \add_action('after_switch_theme', [self::class, 'flush_rewrites_on_activation']);
    }

    public static function register_sw_rewrite(): void
    {
        \add_rewrite_rule('^sw\\.js$', 'index.php?service_worker=1', 'top');
    }

    public static function sw_query_var(array $vars): array
    {
        $vars[] = 'service_worker';
        return $vars;
    }

    /**
     * Prevent canonical redirects for the service worker endpoint and /sw.js
     */
    public static function disable_canonical_for_sw(string|false $redirect_url, string $requested_url): string|false
    {
        if (!empty($_GET['service_worker'])) {
            return false;
        }
        $path = \wp_parse_url($requested_url, PHP_URL_PATH);
        if ($path === '/sw.js' || $path === 'sw.js') {
            return false;
        }
        return $redirect_url;
    }

  public static function output_service_worker(): void
  {
    // Serve via query var OR direct path fallback (/sw.js) even if rewrites are stale
    $is_qv = (bool) \get_query_var('service_worker');
    $req_uri = $_SERVER['REQUEST_URI'] ?? '';
    $path = is_string($req_uri) ? (string) parse_url($req_uri, PHP_URL_PATH) : '';
    $is_sw_path = ($path === '/sw.js' || $path === 'sw.js' || str_ends_with($path, '/sw.js'));
    if (!$is_qv && !$is_sw_path) {
      return;
    }

  $site  = \home_url('/');
  $theme = \get_template_directory_uri();
  // Use theme version for SW version to bust caches on updates
  $theme_obj = \wp_get_theme();
  $ver   = $theme_obj ? (string) ($theme_obj->get('Version') ?: '1.0.0') : '1.0.0';

    \nocache_headers();
    \header('Content-Type: application/javascript; charset=UTF-8');
    \header('Service-Worker-Allowed: /');
    \header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    // Allow HEAD probe with 200 OK (Safari requirement to avoid redirects)
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
      exit; // headers only
    }

        echo "\n";
        ?>
// NK React Theme Service Worker
// Scope: '/'
const SW_VERSION = '<?php echo \esc_js($ver); ?>';
const SITE_URL = '<?php echo \esc_url_raw($site); ?>'.replace(/\/$/, '') + '/';
const THEME_URL = '<?php echo \esc_url_raw($theme); ?>'.replace(/\/$/, '');
const REST_PREFIX = SITE_URL + 'wp-json/';

const PRECACHE = 'nk-precache-' + SW_VERSION;
const RUNTIME = 'nk-runtime-' + SW_VERSION;

const PRECACHE_URLS = [
  THEME_URL + '/build/index.js',
  THEME_URL + '/build/app.css',
  THEME_URL + '/offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PRECACHE);
        await cache.addAll(PRECACHE_URLS);
        // Precache the root HTML as our offline shell
        await cache.add(new Request(SITE_URL, { credentials: 'same-origin' }));
      } catch (_e) { /* ignore */ }
    })()
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
    return (
      u.href.startsWith(THEME_URL + '/build/') ||
      u.href.startsWith(THEME_URL + '/assets/fonts/') ||
      u.href.startsWith(THEME_URL + '/assets/svg/') ||
      u.href === THEME_URL + '/build/app.css'
    );
  } catch (_e) { return false; }
}

function isRestGet(req) {
  return req.method === 'GET' && req.url.indexOf(REST_PREFIX) === 0;
}

function isNavigationRequest(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html'));
}

function isAdminPath(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.pathname.startsWith('/wp-admin') || u.pathname.startsWith('/wp-login');
  } catch (_e) { return false; }
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
      if (cached) {
        event.waitUntil(fetchAndUpdate);
        return cached;
      }
      const net = await fetchAndUpdate;
      return net || new Response(null, { status: 503, statusText: 'Offline' });
    })());
    return;
  }

  // Offline Shell for navigations: NetworkFirst with cached root HTML fallback
  if (isNavigationRequest(req) && !isAdminPath(req.url)) {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        return net;
      } catch (_e) {
        // Prefer pretty offline page, else app shell, else minimal fallback
        const pretty = await caches.match(THEME_URL + '/offline.html', { ignoreSearch: true });
        if (pretty) return pretty;
        const shell = await caches.match(SITE_URL, { ignoreSearch: true });
        if (shell) return shell;
        return new Response('<!doctype html><title>Offline</title><h1>Offline</h1><p>Please reconnect.</p>', { headers: { 'Content-Type': 'text/html; charset=UTF-8' }, status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }
});
<?php
        exit;
    }

    public static function flush_rewrites_on_activation(): void
    {
        self::register_sw_rewrite();
        \flush_rewrite_rules();
    }
}
