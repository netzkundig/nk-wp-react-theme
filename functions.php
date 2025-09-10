<?php
// Minimal functions.php für NK React Theme

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
});

// Filter body classes to add 'nk-react-theme'
function nkreact_body_classes($classes) {
    $classes = ['nk-react-theme'];
    return $classes;
}
add_filter('body_class', 'nkreact_body_classes');

add_action('rest_api_init', function () {
    register_rest_route('nk/v1', '/resolve', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function (WP_REST_Request $req) {
            $path = $req->get_param('path');
            if ($path === null || $path === '') {
                $path = '/';
            }
            $path = '/' . ltrim($path, '/');

            if ($path === '/' || $path === '') {
                if (get_option('show_on_front') === 'page' && ($id = (int) get_option('page_on_front'))) {
                    return array('type' => 'front-page', 'id' => $id);
                }
                return array('type' => 'home');
            }

            $url = home_url($path);
            $id  = url_to_postid($url);

            if ($id) {
                $post = get_post($id);
                if ($post) {
                    $type = $post->post_type === 'page' ? 'page' : ($post->post_type === 'post' ? 'post' : $post->post_type);
                    return array(
                        'type' => $type,
                        'id'   => $id,
                        'slug' => $post->post_name,
                    );
                }
            }
            return new WP_REST_Response(array('type' => '404'), 200);
        }
    ));
});
