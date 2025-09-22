# NK React Theme

Minimalist WordPress theme with React integration to render WordPress content on the client side via the REST API.

## Language Policy
- Use English for all code comments and all commit messages (including AI-generated ones).
- Git hooks are provided to help enforce this. Enable them with:
  `git config core.hooksPath .githooks`
- Editor spell checking is configured for English via `cspell.json`.

## Features
- React app bundled and mounted in `index.php` (progressive enhancement friendly).
- Bootstrap data (site URL, REST URL, front / posts page IDs, logged‑in state) exposed via `window.nkReactTheme`.
- Custom REST route resolver: `GET /wp-json/nk/v1/resolve?path=/foo` → `{ type, id, slug }` (supports: front-page, home, page, post, 404).
- Client routing layer (suggested) via `RouteResolver` component (works without server rewrites because WP serves every request with the theme index template).
- Components: `App`, `Header`, `Footer`, `Home`, `RouteResolver`, `Page`, `Post`, `NotFound`.
- Primary navigation via REST: `PrimaryMenu` component + endpoints `nk/v1/menu/<location>` and `nk/v1/menu-version/<location>` with localStorage caching & version invalidation.
- Content caching with Stale‑While‑Revalidate (SWR): pages, posts and route resolution render instantly from cache (if visited before) and revalidate silently in the background. During route revalidation, the UI indicates loading via `aria-busy` without flicker.
- Route prefetching: on hover/focus and when links enter the viewport, resolver and target resources (page/post) are prefetched to make navigation feel instant.
- Service Worker: offline support and runtime caching (CacheFirst for theme assets incl. `build/index.js`, `build/app.css`, `/assets/fonts/*` and `/assets/svg/*`, SWR for REST GET) served from `/sw.js`.
- Accessible CSS-only loading spinner (`.nk-spinner`) reused across all async states.
- Gravity Forms dynamic initialization after REST content injection.
- Theming: light / dark inversion via CSS custom properties and a state toggle (`lightTheme`).
- Layout: full-height (`min-height:100vh`) flex column with sticky footer.
- Babel configuration (classic JSX) + WordPress Scripts toolchain.
- SVG icons utility: inline and cache SVGs safely via `SvgIcon` (sanitized, default 24px size).
- Icon button utility: accessible button with SVG icon via `IconButton` (visible label or `aria-label`).

## Gravity Forms (REST Submit)
- Client renders WP content (including GF shortcodes/blocks) and intercepts GF form submits in React.
- Submissions are sent to GF REST v2: `/wp-json/gf/v2/forms/{id}/submissions`.
- Inline validation and confirmation are rendered in place.

### Setup
- Enable REST submissions for the form in Gravity Forms (Form Settings → “Submit via REST API”).
- Ensure the theme sets `window.nkReactTheme.restUrl` (done in `functions.php`).
- Forms inside REST-rendered content auto-initialize via `initGravityForms`.

### Files
- `src/utils/initGravityForms.js`: binds submit and posts JSON to GF REST; shows confirmation or field errors.
- `src/Page.js` / `src/Post.js`: after injecting content, call `initGravityForms` on the content container.

### Validation & UX
- Highlights invalid fields with `.gfield_error` and per-field messages.
- Adds a summary box at the top and focuses the first invalid field.
- Disables submit buttons during request to prevent double submits.

### Notes
- reCAPTCHA: works if site keys are configured; tokens from hidden inputs are forwarded.
- File uploads: current JSON submit handler doesn’t support files. Use admin-ajax fallback or extend to multipart if needed.
- Styles: if GF styles are missing in SPA views, enqueue GF CSS globally or add minimal theme styles for `.gform_wrapper`.

## Requirements
- WordPress 6.x (permalinks active)
- Node.js LTS + npm
- PHP 8.2+

## Installation & Build
1. put theme folder `nk-react` to `wp-content/themes/nk-react`.
2. install JS dependencies in the theme folder:
   ```bash
   npm install
   ```
   If the project is fresh:
   ```bash
   npm install @wordpress/scripts @wordpress/element @babel/preset-react @babel/preset-env --save-dev
   ```
3. install PHP autoloader (Composer, PSR-4):
  ```bash
  composer install
  ```
4. run build:
   ```bash
   npx wp-scripts build
   ```
5. activate the theme in the WordPress backend.

Notes:
- The theme uses namespaced PHP with PSR-4 autoloading. Ensure `vendor/autoload.php` exists (run `composer install`).

## Structure (excerpt)
- `index.php` – root container `<div id="app"></div>`.
- `functions.php` – namespaced bootstrap (NkReact\\Theme), loads Composer autoloader, enqueues script & style, injects bootstrap JSON.
- `functions/ServiceWorker/ServiceWorker.php` – class `NkReact\\Theme\\ServiceWorker\\ServiceWorker` provides `/sw.js` via rewrite + outputs SW; flushes rewrite rules on theme activation.
- `functions/service-worker.php` – legacy stub kept for structure; no logic (actual logic lives in the class above).
- `babel.config.js` – classic JSX + env.
- `style.css` – theme header only (WP theme metadata); styles are compiled to `build/app.css`.
- `src/index.js` – mounts `<App />` with router (if installed) / fallback.
- `src/App.js` – global layout, theme state (`lightTheme`), routes placeholder.
- `src/RouteResolver.js` – resolves current `location.pathname` via REST -> chooses component; indicates background revalidation with `aria-busy`.
- `src/Home.js` – front page fetch via `frontPageId` bootstrap + SWR; shows spinner only on first load.
- `src/Page.js` / `src/Post.js` – fetch entity by ID, inject content, init Gravity Forms.
- `src/NotFound.js` – 404 boundary.
- `src/utils/initGravityForms.js` – GF attachment logic.
- `src/utils/wpSWR.js` – SWR hooks for pages, posts and route resolution.
- `src/utils/swrCache.js` – cache helpers (in-memory + localStorage, namespaced by site/auth state).
- `src/utils/prefetch.js` – hover/viewport prefetch for resolver and concrete target resources.
- `src/PrimaryMenu.js` – fetches menu items for the `primary` theme location, builds a nested tree, highlights active links, caches in localStorage with server-side version invalidation.
- `src/utils/SvgIcon.js` – inline SVG utility component with caching and basic sanitization.
- `src/utils/index.js` – utility exports (e.g., `SvgIcon`).
- `src/utils/IconButton.js` – accessible button component with inline SVG icon.

Server PHP (namespaced):
- `functions/rest-api.php` – `NkReact\\Theme\\REST` (custom endpoints / fields, e.g., resolver, menu, menu-version).
- `functions/menus.php` – `NkReact\\Theme\\Menus` (registers WP menus).
- `functions/cleanup.php` – `NkReact\\Theme\\Cleanup` (removes WP head clutter).

Client (React): see sections below.

## PHP Namespacing & Autoloading

This theme uses namespaced PHP with PSR-4 autoloading via Composer.

- Root namespace: `NkReact\\Theme`
- Sub-namespaces: `ServiceWorker`, `REST`, `Menus`, `Cleanup`
- Autoload mapping (composer.json):
  ```json
  {
    "autoload": {
      "psr-4": { "NkReact\\u005cTheme\\u005c": "functions/" }
    }
  }
  ```
- `functions.php` is namespaced (`namespace NkReact\\Theme;`), loads `vendor/autoload.php` and boots modules. Example:
  ```php
  if (\class_exists('NkReact\\\\Theme\\\\ServiceWorker\\\\ServiceWorker')) {
      \NkReact\\Theme\\ServiceWorker\\ServiceWorker::register();
  }
  ```
- Within namespaced files, global WordPress functions are called with a leading backslash (e.g., `\add_action`, `\get_option`, `\register_nav_menus`).
- The theme’s `index.php` is intentionally not namespaced.

Pattern for modules:
- Define a class with static `register()` that attaches all hooks.
- Place it under `functions/<Area>/<Class>.php` with a matching namespace (e.g., `NkReact\\Theme\\ServiceWorker\\ServiceWorker`).
- Let Composer autoload it and call `<Namespace>\\<Class>::register()` from `functions.php`.

## Functionality
Server (WordPress):
- Handles canonical routing & SEO-critical head output (`wp_head`, meta, schema, feeds).
- Supplies bootstrap context (IDs, site title) before React loads.

Client (React):
- Resolves requested path via `nk/v1/resolve` (no need to guess slugs → IDs).
- Fetches appropriate REST resource and injects HTML, using SWR cache‑first logic for previously visited content.
- Updates `document.title` per view (basic client-side SEO hint for SPA navigation).
- Provides unified loading spinner & error boundaries per view.
- Caches primary menu for anonymous users: compares server `menu-version` hash; reloads menu automatically when changed in WP.
- Prefetches routes and target REST resources on hover/viewport for near-instant transitions.

### Primary Menu (REST + cache)
- Endpoints:
  - `GET /wp-json/nk/v1/menu/primary` → `{ items: [...] }`
  - `GET /wp-json/nk/v1/menu-version/primary` → `{ version: "<sha256>" }`
- Client:
  - Reads from `localStorage` when version matches; otherwise fetches fresh and stores new version.
  - Skips cache for logged-in users to reflect admin changes immediately.

### SWR Caching (Pages, Posts, Resolver)
- Hooks in `src/utils/wpSWR.js` provide SWR behavior for pages (`useWPPage`), posts (`useWPPost`) and route resolution (`useResolvePath`).
- Cache keys are namespaced by site URL and auth state, data lives in memory and `localStorage`.
- Version detection uses `modified_gmt` (fallback to `id:date_gmt`).
- UI stays visible during background revalidation; initial loads show the spinner only when no cache exists.
 - Fetches use `AbortController` and ignore abort errors to avoid transient error flashes (notably in Firefox) when navigations cancel in‑flight requests.

### Service Worker (offline + caching)
- Served from `/sw.js` with root scope.
- Implemented as a namespaced class: `functions/ServiceWorker/ServiceWorker.php` → `NkReact\\Theme\\ServiceWorker\\ServiceWorker`.
- The legacy file `functions/service-worker.php` is a no-op stub kept only to preserve structure.
- Strategies:
  - CacheFirst for theme assets (`build/index.js`, `build/app.css`) and fonts under `/assets/fonts/*` as well as SVGs under `/assets/svg/*`.
  - Stale-While-Revalidate for REST `GET /wp-json/*`.
- On theme activation, rewrite rules are flushed automatically so `/sw.js` works immediately.

## Data flow
1. PHP injects `window.nkReactTheme` (shape example):
   ```json
   {
     "siteUrl": "https://example.test/", 
     "restUrl": "https://example.test/wp-json/", 
     "frontPageId": 2,
     "blogPageId": 15,
     "showOnFront": "page",
     "isUserLoggedIn": false
   }
   ```
2. `RouteResolver` → `GET /wp-json/nk/v1/resolve?path=/about` ⇒ `{ "type": "page", "id": 42 }`.
3. Component (`Page` / `Post`) fetches `/wp-json/wp/v2/{type}s/{id}`.
4. HTML content inserted → Gravity Forms initializer runs.
5. Loading & error states display spinner / message until resolved.

## Development
- Watch/Dev-Build (if script exists):
  ```bash
  npx wp-scripts start
  ```
- Production build:
  ```bash
  npx wp-scripts build
  ```

## SCSS & Build

The theme ships SCSS organized under `src/styles/` (7-1 inspired). The entry point is `src/styles/app.scss`. We compile to `build/app.css`, which is enqueued by the theme. The file `style.css` contains only the theme header.

Key folders:
- `abstracts/` variables, mixins, functions, breakpoints (`@mixin breakpoint($bp)`)
 - `abstracts/` variables, mixins, functions, breakpoints (`@mixin breakpoint($bp, $type: min)` supports `min`|`max`)
- `base/` base layout, typography, WordPress core helpers (alignfull/alignwide)
- `layout/`, `components/`, `blocks/`, `pages/`, `plugins/`, `themes/`

Try it:

```bash
# Development CSS (no source map, fast)
npm run css:dev

# Production CSS (minified)
npm run css:prod

# Full dev workflow (JS watch + CSS watch in parallel)
npm run dev

# Full production build (JS build + CSS minified)
npm run prod
```

Notes:
- Uses Dart Sass with `@use` instead of deprecated `@import`.
- App CSS is served from `build/app.css` (see `functions.php`).

## Fonts via theme.json

Fonts are loaded declaratively through `theme.json`, not via SCSS. Place font files under `assets/fonts/<family>/...` and reference them with `file:` URLs. WordPress will generate the `@font-face` rules for both frontend and editor.

Example `theme.json` snippet:

```json
{
  "settings": {
    "typography": {
      "fontFamilies": [
        {
          "slug": "inter",
          "name": "Inter",
          "fontFace": [
            {
              "fontFamily": "Inter",
              "fontStyle": "normal",
              "fontWeight": "100 900",
              "fontDisplay": "swap",
              "src": ["file:./assets/fonts/inter/Inter-VariableFont_slnt,wght.woff2"]
            }
          ]
        }
      ]
    }
  }
}
```

Usage in CSS/SCSS:

```css
body { font-family: var(--wp--preset--font-family--inter), system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
```

Notes:
- Prefer WOFF2 and `font-display: swap`.
- No duplicate `@font-face` in SCSS required.
- Service Worker caches `/assets/fonts/*` with CacheFirst to improve repeat loads and offline behavior.

## SVG icons (inline via SvgIcon)

Use the `SvgIcon` utility to inline SVGs as React components. This avoids additional `<img>` requests, enables styling via CSS, and keeps accessibility under control.

Files:
- `src/utils/SvgIcon.js` – loader with in‑memory caching and basic sanitization
- Optional asset folder: `assets/svg/` (e.g., `assets/svg/logo.svg`)

Usage:

```jsx
import { SvgIcon } from './src/utils';

// By name (resolved under assetsBase, default: /wp-content/themes/nk-react/assets/svg)
<SvgIcon name="logo" title="Site logo" />

// By absolute/relative URL
<SvgIcon src="/wp-content/themes/nk-react/assets/svg/icon-arrow.svg" decorative />

// Override size
<SvgIcon name="logo" style={{ width: '24px', height: '24px' }} />
```

Details:
- Default size is 24px × 24px with `display:inline-block`. Override via `style` or CSS classes.
- If the root `<svg>` has no `width`/`height`, the utility adds `width="100%" height="100%"` so it scales to the wrapper size.
- Accessibility:
  - Use `decorative` for purely visual icons (sets `aria-hidden="true"`).
  - Provide `title` (maps to `aria-label`) for meaningful icons.
- Security: the markup is sanitized (removes `<script>` and `on*=` handlers, strips `xmlns:xlink`). Only load trusted SVGs.
- Performance: responses are cached in‑memory per URL during the session.
- Service Worker: `/assets/svg/*` is included in the CacheFirst list by default (see Service Worker section).

Alternative: If you prefer compile‑time React components with props (e.g., color/size), integrate SVGR in your build and import SVGs as components instead of inlining at runtime.

## Icon buttons (IconButton)

Use `IconButton` for accessible buttons that include an inline SVG icon (powered by `SvgIcon`). Provide either a visible text label (children) or an `ariaLabel`.

Files:
- `src/utils/IconButton.js`

Usage:

```jsx
import { IconButton } from './src/utils';

// Icon only (needs ariaLabel)
<IconButton iconName="menu" ariaLabel="Open menu" onClick={toggle} />

// Icon left + text label
<IconButton iconName="sun" onClick={toggleTheme}>Light Mode</IconButton>

// Icon right + custom size
<IconButton iconName="arrow-right" iconPosition="right" iconSize="1.25rem">Next</IconButton>
```

Props (common):
- `type` ('button'|'submit'|'reset') default 'button'
- `title` (tooltip), `disabled`, `className`, `style`
- `ariaLabel` required if no visible children label

Icon props:
- `iconName` or `iconSrc` (passed to SvgIcon), optional `assetsBase`
- `iconSize` (default '1rem'), `iconPosition`: 'left' | 'right' | 'only' (default 'left')
- `decorativeIcon` (default true) hides icon from a11y tree; set false when icon itself conveys meaning

A11y:
- Visible text OR `ariaLabel` is required. The component warns in dev if neither is provided.
- Keep `decorativeIcon` true for purely visual icons; otherwise provide a meaningful `ariaLabel`.

## Internationalization (i18n)

This theme is prepared for translations in PHP and JavaScript.

- PHP: `load_theme_textdomain('nk-react', get_template_directory() . '/languages')` is called on `after_setup_theme`.
- JS: The bundle depends on `wp-i18n` and registers translations with `wp_set_script_translations('nk-react-app', 'nk-react', get_template_directory() . '/languages')`.
- Strings in React components are wrapped with `__('…', 'nk-react')` from `@wordpress/i18n`.

### Generate POT (source of truth)
Use WP-CLI i18n tools (requires `wp-cli` and the i18n package installed):

```bash
# From the theme folder
wp i18n make-pot . languages/nk-react.pot \
  --domain=nk-react \
  --exclude=node_modules,build,vendor
```

### Create/Update PO/MO for a locale
- Open `languages/nk-react.pot` in Poedit (or similar).
- Save as `languages/nk-react-<locale>.po` (e.g. `nk-react-de_DE.po`).
- Poedit will compile the corresponding `.mo` automatically.

### Generate JSON for JS translations
WordPress loads JS translations from JSON files alongside the script handle and domain.

```bash
# Convert PO to JSON files for JS (keeps existing JSON files)
wp i18n make-json languages --no-purge
```

Notes:
- JSON files will be created per locale (e.g. `languages/nk-react-de_DE-<hash>.json`).
- Ensure the text domain matches exactly: `nk-react`.
- The theme header contains `Text Domain: nk-react` and `Domain Path: /languages`.

### Try it: i18n scripts

Prerequisites:
- wp-cli with i18n commands available (wp i18n ...), WordPress site context.

Run from the theme folder:

```bash
# Generate POT
npm run i18n:pot

# Generate JSON from existing PO/MO
npm run i18n:json

# Do both
npm run i18n:all
```

## Try it

1) Build and activate
- Install and build in the theme folder:
  ```bash
  npm install
  npx wp-scripts build
  ```
- Activate the theme in WP Admin → Appearance → Themes.
- The theme auto-flushes rewrite rules on activation so `/sw.js` works right away.

2) Verify SWR cache (no flicker on revisit)
- Navigate to a page or post: you should see the spinner only on the very first view.
- Navigate away and back: content should appear instantly with no spinner; background revalidation runs silently.
 - Assistive tech: while revalidating a resolved route, the wrapper sets `aria-busy` to signal loading state without altering layout.

3) Verify Prefetch (hover/viewport)
- Open DevTools → Network (disable cache in devtools if you want to observe requests clearly).
- Hover menu links or scroll them into view: you should see requests to:
  - `/wp-json/nk/v1/resolve?path=…` (resolver)
  - `/wp-json/wp/v2/pages/:id` or `/wp-json/wp/v2/posts/:id` (target resource)
- Click the link: navigation should be near-instant since data is already prefetched.

Tip: Prefetch respects Data Saver and won’t run if the browser signals reduced data usage.

4) Verify Service Worker (offline/runtime cache)
- Important: Service Workers require secure origins. Our code does NOT register the SW on `localhost`. To test:
  - Option A (recommended): Use a local HTTPS domain (e.g. `https://example.test`) so the SW registers automatically.
  - Option B (dev only): Temporarily remove the localhost check in `src/index.js` (search for `isLocalhost`) to register on `http://localhost`.
- Visit a few pages while online (to warm the runtime cache).
- Open DevTools → Application → Service Workers and confirm `/sw.js` is active.
- Toggle “Offline” in the Network tab and reload:
  - Theme assets should load (precache, CacheFirst).
  - Previously visited pages should render from the runtime REST cache.
  - Unvisited pages will return a 503 (expected when offline).
 - Note: The SW only caches GET requests; admin/auth routes are bypassed.

5) Reset caches (if needed)
- DevTools → Application → Storage → Clear site data, and “Unregister” under Service Workers.
- Optionally clear `localStorage` to drop SWR and menu caches.

## Routing (extensible)
Current approach:
- WP handles initial request (full page load) → universal index template.
- React mounts & resolves the same path via `nk/v1/resolve`.
- When `react-router-dom` is added, internal `<Link>` transitions skip full reloads.

Add client router:
```bash
npm install react-router-dom
```
Wrap root with `<BrowserRouter>` and keep `RouteResolver` as catch-all (`path="*"`).

Extending resolver:
- Archives: detect `is_post_type_archive()` or taxonomy queries server-side if needed (add logic to the resolver endpoint).
- Search: if `path` starts with `/search/` parse query segment.
- Pagination: include `paged` parameter in resolver result.

## Security & Notes
- `dangerouslySetInnerHTML` only renders server-filtered WP content (respect WP sanitization pipeline).
- Avoid protected endpoints like `/wp/v2/settings` for anonymous views (use bootstrap IDs or public endpoints instead).
- Gravity Forms submission over REST: ensure proper capability restrictions in GF settings.
- Add nonce headers for mutating requests if you extend to authenticated POST/PUT actions.

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| 401 on `/wp/v2/settings` | Endpoint requires auth | Use bootstrap data or public endpoints |
| Spinner never hides | Fetch promise rejected silently | Check network tab & console, ensure resolver returns JSON |
| `Cannot read properties of undefined (reading 'jsx')` | Missing Babel config / transform mismatch | Ensure `babel.config.js` + rebuild |
| Empty `#app` | Script not enqueued or build missing | Re-run build, verify `functions.php` enqueue |
| GF form not submitting | REST setting off / wrong form ID | Enable REST submit & check network request |
| Footer not sticking | Body class missing | Ensure `body_class` outputs `nk-react-theme` |
| Flash of wrong theme colors | No initial CSS variables | Add base color variables to `:root` / body |

### Service Worker (Safari / NGINX)
- Symptoms (Safari): Console shows
  - `Not allowed to follow a redirection while loading /sw.js`
  - or `Failed to load resource: 404 (Not Found)` for `/sw.js`.
- Cause: Safari disallows redirected Service Worker scripts. Some servers (e.g., strict NGINX/Valet configs) may redirect `/sw.js` or not route rewrites yet.
- Theme behavior:
  - Registration probes `/sw.js` with `HEAD` (no redirect). If not 200, it falls back to `/?service_worker=1` (same worker, no redirect).
  - The server disables canonical redirects for `/sw.js` and `?service_worker=1` and sets `Service-Worker-Allowed: /` for root scope.
- What to do if still affected:
  - Reactivate the theme (flushes rewrite rules) or re-save permalinks.
  - Ensure your web server doesn’t serve a static `sw.js` or enforce a redirect before WordPress rewrites.
  - DevTools → Application → Service Workers: Unregister → Storage: Clear site data → Hard reload.

## Loading UX
- Unified spinner: `.nk-spinner-wrapper` centers; `.nk-spinner` uses dual ring animation.
- Respects `prefers-reduced-motion` → disables animation.
- Accessible via `aria-label` on spinner container.

## Theming
Toggle flips semantic variables derived from WordPress preset color slots (`--wp--preset--color--base`, `--wp--preset--color--contrast`). To extend:
```css
:root {
  --nk-transition: 0.25s ease; 
}
body { transition: background var(--nk-transition), color var(--nk-transition); }
```

## Possible Enhancements
- Add service worker for offline shell.
- Implement incremental static hydration (progressively replace SSR fragments).
- Add schema injection per route (JSON-LD) via small PHP helper + JS overrides.
- Introduce a data cache context (LRU) to avoid duplicate REST fetches on quick route changes.

## Next steps
- Implement archive & taxonomy resolver logic.
- Integrate search (server param pass-through + component).
- Move design tokens fully into `theme.json` for Gutenberg parity.
- Add Jest / React Testing Library smoke tests.

