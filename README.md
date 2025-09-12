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
- Content caching with Stale‑While‑Revalidate (SWR): pages, posts and route resolution render instantly from cache (if visited before) and revalidate silently in the background.
- Route prefetching: on hover/focus and when links enter the viewport, resolver and target resources (page/post) are prefetched to make navigation feel instant.
- Service Worker: offline support and runtime caching (CacheFirst for theme assets, SWR for REST GET) served from `/sw.js`.
- Accessible CSS-only loading spinner (`.nk-spinner`) reused across all async states.
- Gravity Forms dynamic initialization after REST content injection.
- Theming: light / dark inversion via CSS custom properties and a state toggle (`lightTheme`).
- Layout: full-height (`min-height:100vh`) flex column with sticky footer.
- Babel configuration (classic JSX) + WordPress Scripts toolchain.

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
- PHP 7.4+ / 8.x

## Installation & Build
1. put theme folder `nk-react` to `wp-content/themes/nk-react`.
2. install dependencies in the theme folder:
   ```bash
   npm install
   ```
   If the project is fresh:
   ```bash
   npm install @wordpress/scripts @wordpress/element @babel/preset-react @babel/preset-env --save-dev
   ```
3. run build:
   ```bash
   npx wp-scripts build
   ```
4. activate the theme in the WordPress backend.

## Structure (excerpt)
- `index.php` – root container `<div id="app"></div>`.
- `functions.php` – enqueues built script & style, injects bootstrap JSON, registers `nk/v1/resolve`.
- `functions/service-worker.php` – provides `/sw.js` via rewrite + outputs SW; flushes rewrite rules on theme activation.
- `babel.config.js` – classic JSX + env.
- `style.css` – theme header + layout (flex, sticky footer) + spinner styles.
- `src/index.js` – mounts `<App />` with router (if installed) / fallback.
- `src/App.js` – global layout, theme state (`lightTheme`), routes placeholder.
- `src/RouteResolver.js` – resolves current `location.pathname` via REST -> chooses component.
- `src/Home.js` – front page fetch via `frontPageId` bootstrap + SWR; shows spinner only on first load.
- `src/Page.js` / `src/Post.js` – fetch entity by ID, inject content, init Gravity Forms.
- `src/NotFound.js` – 404 boundary.
- `src/utils/initGravityForms.js` – GF attachment logic.
- `src/utils/wpSWR.js` – SWR hooks for pages, posts and route resolution.
- `src/utils/swrCache.js` – cache helpers (in-memory + localStorage, namespaced by site/auth state).
- `src/utils/prefetch.js` – hover/viewport prefetch for resolver and concrete target resources.
- `src/PrimaryMenu.js` – fetches menu items for the `primary` theme location, builds a nested tree, highlights active links, caches in localStorage with server-side version invalidation.

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

### Service Worker (offline + caching)
- Served from `/sw.js` with root scope, implemented in PHP: `functions/service-worker.php`.
- Strategies:
  - CacheFirst for theme assets (`build/index.js`, `style.css`).
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

3) Verify Prefetch (hover/viewport)
- Open DevTools → Network (disable cache in devtools if you want to observe requests clearly).
- Hover menu links or scroll them into view: you should see requests to:
  - `/wp-json/nk/v1/resolve?path=…` (resolver)
  - `/wp-json/wp/v2/pages/:id` or `/wp-json/wp/v2/posts/:id` (target resource)
- Click the link: navigation should be near-instant since data is already prefetched.

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
- Preload front-page & navigation targets (link hover → prefetch JSON).
- Add service worker for offline shell.
- Implement incremental static hydration (progressively replace SSR fragments).
- Add schema injection per route (JSON-LD) via small PHP helper + JS overrides.
- Introduce a data cache context (LRU) to avoid duplicate REST fetches on quick route changes.

## Next steps
- Implement archive & taxonomy resolver logic.
- Integrate search (server param pass-through + component).
- Move design tokens fully into `theme.json` for Gutenberg parity.
- Add Jest / React Testing Library smoke tests.

