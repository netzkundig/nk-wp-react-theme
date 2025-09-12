<?php
/**
 * Functions for NK React Theme
 * @package nk-react
 * @license GPL-2.0-or-later
 * @link    https://netzkundig.com/
 */

// Enqueue React app script and styles, and pass initial data to JS
add_action('wp_enqueue_scripts', function () {
    $ver = '1.0.0';
    wp_enqueue_script(
        'nk-react-app',
        get_template_directory_uri() . '/build/index.js',
        array('wp-element'),
        $ver,
        true
    );
    wp_enqueue_style('nk-react-style', get_stylesheet_uri());
    $bootstrap = array(
        'siteUrl'      => home_url('/'),
        'restUrl'      => get_rest_url(),
        'siteTitle'    => get_bloginfo('name'),
        'frontPageId'  => (get_option('show_on_front') === 'page') ? (int) get_option('page_on_front') : null,
        'showOnFront'  => get_option('show_on_front'),
        'blogPageId'   => (get_option('show_on_front') === 'page') ? (int) get_option('page_for_posts') : null,
        'themeDir'     => get_template_directory_uri(),
        'isUserLoggedIn' => is_user_logged_in(),
        'currentUserId' => get_current_user_id(),
    );
    wp_add_inline_script('nk-react-app', 'window.nkReactTheme = ' . wp_json_encode($bootstrap) . ';', 'before');
    // Provide REST API credentials for frontend scripts (e.g., blocks using api-fetch)
    $wp_rest_nonce = wp_create_nonce('wp_rest');
    $wp_rest_root  = esc_url_raw(get_rest_url());
    wp_enqueue_script('wp-api-fetch');
    $wp_api_settings = 'window.wpApiSettings = window.wpApiSettings || {};'
        . 'window.wpApiSettings.nonce = ' . wp_json_encode($wp_rest_nonce) . ';'
        . 'window.wpApiSettings.root = ' . wp_json_encode($wp_rest_root) . ';';
    wp_add_inline_script('wp-api-fetch', $wp_api_settings, 'before');

    // Front-end guard: prevent write requests to WP REST API for anonymous users to avoid 401 noise
    $rest_guard = '(function(){try{var loggedIn=' . (is_user_logged_in() ? 'true' : 'false') . ';'
        . 'if(!window.wp||!wp.apiFetch||!wp.apiFetch.use){return;}'
        . 'wp.apiFetch.use(function(options,next){try{var m=(options&&options.method||"GET").toUpperCase();'
        . 'var t=String((options&&options.path)||options.url||"");'
        . 'if(!loggedIn && m!=="GET" && /\\/wp\\/v2\\//.test(t)){'
        . 'console&&console.warn&&console.warn("Blocked front-end REST write:",m,t);'
        . 'return Promise.resolve({});}'
        . '}catch(e){}return next(options);});}catch(e){}})();';
    wp_add_inline_script('wp-api-fetch', $rest_guard, 'after');

    // Global fetch guard (covers callers not using wp.apiFetch)
    $global_fetch_guard = '(function(){try{var loggedIn=' . (is_user_logged_in() ? 'true' : 'false') . ';'
        . 'if(typeof window.fetch!=="function"||loggedIn){return;}'
        . 'var _fetch=window.fetch;'
        . 'window.fetch=function(input,init){try{var url=(typeof input==="string"?input:(input&&input.url)||"");'
        . 'var m=(init&&init.method)||"GET"; m=String(m).toUpperCase();'
        . 'if(m!=="GET" && /\\/wp-json\\/wp\\/v2\\//.test(url)){'
        . 'console&&console.warn&&console.warn("Blocked fetch REST write:",m,url);'
        . 'return Promise.resolve(new Response(null,{status:204,statusText:"No Content"}));}'
        . '}catch(e){} return _fetch.apply(this,arguments); }; }catch(e){}})();';
    wp_add_inline_script('nk-react-app', $global_fetch_guard, 'before');
});

// Filter body classes to add 'nk-react-theme'
function nkreact_body_classes($classes) {
    $classes = ['nk-react-theme'];
    return $classes;
}
add_filter('body_class', 'nkreact_body_classes');

// Include custom REST API endpoints and fields
require get_template_directory() . '/functions/rest-api.php';

// Include menu registrations
require get_template_directory() . '/functions/menus.php';

// Include service worker wiring (rewrite + output)
require get_template_directory() . '/functions/service-worker.php';