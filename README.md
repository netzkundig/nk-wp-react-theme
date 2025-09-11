# NK React Theme

Minimalist WordPress theme with React integration to render WordPress content on the client side via the REST API.

## Language Policy
- Use English for all code comments and all commit messages (including AI-generated ones).
- Git hooks are provided to help enforce this. Enable them with:
  `git config core.hooksPath .githooks`
- Editor spell checking is configured for English via `cspell.json`.

## Features
- React app is bundled in the theme and mounted in `index.php`.
- Bootstrap data (site URL, REST URL, frontpage ID, etc.) is passed to `window.nkReactTheme`.
- Own REST resolver (`/wp-json/nk/v1/resolve`) assigns paths (/, /page, /post) to WordPress objects.
- Example components: `App`, `Header`, `Footer`, `Home` (frontpage content via REST).
- Babel configuration for JSX-Transform (classic) and modern JS.

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
- `index.php` - contains `<div id="app"></div>` to mount the React app.
- `functions.php` - loads bundle `build/index.js`, CSS, and sets `window.nkReactTheme`; registers the route resolver.
- `babel.config.js` - Babel presets (`@babel/preset-react` classic, `@babel/preset-env`).
- `src/`
  - `index.js` - entry point, mounts app in `#app` (with fallback for createRoot/render from `@wordpress/element`).
  - `App.js` - frame (header/footer), theme toggle, main area.
  - `Home.js` - loads frontpage content via REST.
  - `Header.js`, `Footer.js` - UI components.

## Functionality
- PHP still renders head/meta via `wp_head()` (SEO is preserved).
- `functions.php` registers a lightweight resolver endpoint `nk/v1/resolve` to support client routing.
- React renders content loaded via REST API (e.g. `wp/v2/pages`, `wp/v2/posts`).

## Data flow
- `functions.php` sets `window.nkReactTheme` with e.g. `siteUrl`, `restUrl`, `frontPageId`.
- `Home.js` loads the defined start page via REST. Currently `/wp-json/wp/v2/pages?filter[front_page]=true` is checked and the front page is rendered if successful.
- Optionally, the `frontPageId` from `window.nkReactTheme.frontPageId` can be used directly to retrieve `/wp/v2/pages/{id}`.

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
The theme contains a REST resolver (`nk/v1/resolve`). For real client routing (Page/Post/Frontpage/404) we recommend `react-router-dom`. Steps:
- Install: `npm install react-router-dom`
- Create a `RouteResolver` that resolves `location.pathname` via `/nk/v1/resolve` and loads suitable components (Page/Post/Home/404).

## Security & Notes
- When rendering WP content, `dangerouslySetInnerHTML` is used. Content comes from WordPress and should already be filtered on the server side.
- Authentication is required for endpoints such as `/wp/v2/settings` (often leads to 401 locally). This theme avoids this by using alternative queries or bootstrap data.

## Troubleshooting
- 401 Unauthorized: Do not use protected endpoints like `/wp/v2/settings` without auth. Use `window.nkReactTheme.frontPageId` or public endpoints like `wp/v2/pages`.
- `Cannot read properties of undefined (reading 'jsx')`: Make sure that `babel.config.js` exists and `npx wp-scripts build` has run; we use the classic JSX transform.
- Empty `#app`: Check if `build/index.js` exists and the script is included in `functions.php`.
- Gravity Forms submit returns 401/403: Enable “Submit via REST API” in the form settings. Confirm requests hit `/wp-json/gf/v2/forms/{id}/submissions`.
- Validation errors but no messages: Verify input names (e.g., `input_4.3`) in the markup match GF field keys. The handler maps dots to underscores.

## Next steps
- Add page/post components that load content via ID (see example in the suggestions).
- Activate client routing with `react-router-dom` and the existing resolver.
- Map archives/taxonomies and search.
- Styling: Add most fo the styling (all?) to theme.json
