<?php
/**
 * Functions for NK React Theme (namespaced)
 * @package nk-react
 * @license GPL-2.0-or-later
 * @link    https://netzkundig.com/
 */

namespace NkReact\Theme;

// Enforce minimum PHP version 8.2
if (\version_compare(PHP_VERSION, '8.2.0', '<')) {
    if (\is_admin()) {
        \add_action('admin_notices', function () {
            echo '<div class="notice notice-error"><p>NK React Theme requires PHP 8.2 or higher.</p></div>';
        });
    }
    return;
}

// Composer Autoloader
$autoload = \get_template_directory() . '/vendor/autoload.php';
if (\file_exists($autoload)) {
    require $autoload;
} else {
    if (\is_admin()) {
        \add_action('admin_notices', function () {
            echo '<div class="notice notice-warning"><p>Please run <code>composer install</code> for NK React Theme.</p></div>';
        });
    }
}

// Load theme text domain for PHP translations
\add_action('after_setup_theme', function () {
    \load_theme_textdomain('nk-react', \get_template_directory() . '/languages');
});

// Enqueue React app script and styles, and pass initial data to JS
\add_action('wp_enqueue_scripts', function () {
    $ver = '1.0.0';
    \wp_enqueue_script(
        'nk-react-app',
        \get_template_directory_uri() . '/build/index.js',
        array('wp-element','wp-i18n'),
        $ver,
        true
    );
    // Enqueue compiled theme CSS (app.css). Keep style.css only as theme header.
    \wp_enqueue_style('nk-react-style', \get_template_directory_uri() . '/build/app.css', array(), $ver);
    $bootstrap = array(
        'siteUrl'        => \home_url('/'),
        'restUrl'        => \get_rest_url(),
        'siteTitle'      => \get_bloginfo('name'),
        'frontPageId'    => (\get_option('show_on_front') === 'page') ? (int) \get_option('page_on_front') : null,
        'showOnFront'    => \get_option('show_on_front'),
        'blogPageId'     => (\get_option('show_on_front') === 'page') ? (int) \get_option('page_for_posts') : null,
        'themeDir'       => \get_template_directory_uri(),
        'isUserLoggedIn' => \is_user_logged_in(),
        'currentUserId'  => \get_current_user_id(),
    );
    // Provide Gravity Forms asset URLs so React app can load CSS when forms are injected via REST
    if (\class_exists('GFForms')) {
        $gf_base_url  = \plugins_url('', 'gravityforms/gravityforms.php');
        $gf_base_path = \WP_PLUGIN_DIR . '/gravityforms';
        $candidates = array(
            '/assets/css/dist/reset.min.css',
            '/assets/css/dist/formsmain.min.css',
            '/assets/css/dist/readyclass.min.css',
        );
        $gf_css = array();
        foreach ($candidates as $rel) {
            if (\file_exists($gf_base_path . $rel)) {
                $gf_css[] = $gf_base_url . $rel;
            }
        }
        if (!empty($gf_css)) {
            $bootstrap['gfAssets'] = array('css' => $gf_css);
        }
    }
    \wp_add_inline_script('nk-react-app', 'window.nkReactTheme = ' . \wp_json_encode($bootstrap) . ';', 'before');
    // Provide REST API credentials for frontend scripts (e.g., blocks using api-fetch)
    $wp_rest_nonce = \wp_create_nonce('wp_rest');
    $wp_rest_root  = \esc_url_raw(\get_rest_url());
    \wp_enqueue_script('wp-api-fetch');
    $wp_api_settings = 'window.wpApiSettings = window.wpApiSettings || {};'
        . 'window.wpApiSettings.nonce = ' . \wp_json_encode($wp_rest_nonce) . ';'
        . 'window.wpApiSettings.root = ' . \wp_json_encode($wp_rest_root) . ';';
    \wp_add_inline_script('wp-api-fetch', $wp_api_settings, 'before');

    // Front-end guard: prevent write requests to WP REST API for anonymous users to avoid 401 noise
    $rest_guard = '(function(){try{var loggedIn=' . (\is_user_logged_in() ? 'true' : 'false') . ';'
        . 'if(!window.wp||!wp.apiFetch||!wp.apiFetch.use){return;}'
        . 'wp.apiFetch.use(function(options,next){try{var m=(options&&options.method||"GET").toUpperCase();'
        . 'var t=String((options&&options.path)||options.url||"");'
        . 'if(!loggedIn && m!=="GET" && /\\/wp\\/v2\\//.test(t)){' 
        . 'console&&console.warn&&console.warn("Blocked front-end REST write:",m,t);'
        . 'return Promise.resolve({});}'
        . '}catch(e){}return next(options);});}catch(e){}})();';
    \wp_add_inline_script('wp-api-fetch', $rest_guard, 'after');

    // Global fetch guard (covers callers not using wp.apiFetch)
    $global_fetch_guard = '(function(){try{var loggedIn=' . (\is_user_logged_in() ? 'true' : 'false') . ';'
        . 'if(typeof window.fetch!=="function"||loggedIn){return;}'
        . 'var _fetch=window.fetch;'
        . 'window.fetch=function(input,init){try{var url=(typeof input==="string"?input:(input&&input.url)||"");'
        . 'var m=(init&&init.method)||"GET"; m=String(m).toUpperCase();'
        . 'if(m!=="GET" && /\\/wp-json\\/wp\\/v2\\//.test(url)){' 
        . 'console&&console.warn&&console.warn("Blocked fetch REST write:",m,url);'
        . 'return Promise.resolve(new Response(null,{status:204,statusText:"No Content"}));}'
        . '}catch(e){} return _fetch.apply(this,arguments); }; }catch(e){}})();';
    \wp_add_inline_script('nk-react-app', $global_fetch_guard, 'before');

    // Setup script translations for JS i18n (uses .json generated by wp i18n tools)
    if (\function_exists('wp_set_script_translations')) {
        \wp_set_script_translations('nk-react-app', 'nk-react', \get_template_directory() . '/languages');
    }
});

// Filter body classes to add 'nk-react-theme'
function nkreact_body_classes($classes)
{
    $classes = ['nk-react-theme','wp-embed-responsive'];
    return $classes;
}
\add_filter('body_class', __NAMESPACE__ . '\\nkreact_body_classes');

// Include cleanup of wp_head and other elements. Move this to a MU-plugin to keep it active when switching themes.
require \get_template_directory() . '/functions/cleanup.php';

// Include custom REST API endpoints and fields
require \get_template_directory() . '/functions/rest-api.php';

// Include centralized theme supports configuration
require \get_template_directory() . '/functions/theme-supports.php';

// Disable Customizer (capability, menu, admin bar, access)
require \get_template_directory() . '/functions/disable-customizer.php';

// Include menu registrations
require \get_template_directory() . '/functions/menus.php';

// Register Service Worker module (namespaced class)
if (\class_exists('NkReact\\Theme\\ServiceWorker\\ServiceWorker')) {
    \NkReact\Theme\ServiceWorker\ServiceWorker::register();
}