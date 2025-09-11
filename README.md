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
- `babel.config.js` – classic JSX + env.
- `style.css` – theme header + layout (flex, sticky footer) + spinner styles.
- `src/index.js` – mounts `<App />` with router (if installed) / fallback.
- `src/App.js` – global layout, theme state (`lightTheme`), routes placeholder.
- `src/RouteResolver.js` – resolves current `location.pathname` via REST -> chooses component.
- `src/Home.js` – front page fetch (currently experimental: uses `pages?filter[front_page]=true`).
- `src/Page.js` / `src/Post.js` – fetch entity by ID, inject content, init Gravity Forms.
- `src/NotFound.js` – 404 boundary.
- `src/utils/initGravityForms.js` – GF attachment logic.

## Functionality
Server (WordPress):
- Handles canonical routing & SEO-critical head output (`wp_head`, meta, schema, feeds).
- Supplies bootstrap context (IDs, site title) before React loads.

Client (React):
- Resolves requested path via `nk/v1/resolve` (no need to guess slugs → IDs).
- Fetches appropriate REST resource and injects HTML.
- Updates `document.title` per view (basic client-side SEO hint for SPA navigation).
- Provides unified loading spinner & error boundaries per view.

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
- Introduce SWR / React Query for caching.
- Move design tokens fully into `theme.json` for Gutenberg parity.
- Add Jest / React Testing Library smoke tests.

