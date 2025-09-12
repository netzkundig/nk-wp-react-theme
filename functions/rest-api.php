<?php
/**
 * REST API custom endpoints and fields for NK React Theme
 * @package nk-react
 * @license GPL-2.0-or-later
 * @link    https://netzkundig.com/
 */

add_action('rest_api_init', function () {

    // Custom endpoint to resolve a URL path to a post type and ID

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

    // REST field: expose used block names for all post types supporting block editor (editor + show_in_rest)

    $types = get_post_types(['show_in_rest' => true], 'names');
    if (empty($types)) {
        return;
    }
    foreach ($types as $type) {
        if (!post_type_supports($type, 'editor')) {
            continue; // skip types without block editor support
        }
        register_rest_field($type, 'blockNames', [
            'get_callback' => function ($post) {
                $content = get_post_field('post_content', $post['id']);
                if (empty($content)) {
                    return [];
                }
                $blocks = parse_blocks($content);
                if (empty($blocks)) {
                    return [];
                }
                // Flatten only top-level block names; extend if nested traversal needed
                return array_values(array_filter(array_map(function ($block) {
                    return isset($block['blockName']) ? $block['blockName'] : null;
                }, $blocks)));
            },
            'schema' => [
                'description' => 'List of Gutenberg block names used in the post content (top-level).',
                'type'        => 'array',
                'items'       => [ 'type' => 'string' ],
                'context'     => ['view', 'edit'],
            ],
        ]);
    }

    // Custom endpoint to expose a menu by theme location
    register_rest_route('nk/v1', '/menu/(?P<location>[a-zA-Z0-9_-]+)', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function (WP_REST_Request $req) {
            $location = sanitize_key($req['location']);
            $locations = get_nav_menu_locations();
            if (empty($locations[$location])) {
                return new WP_REST_Response(['items' => []], 200);
            }
            $menu_id = (int) $locations[$location];
            $items = wp_get_nav_menu_items($menu_id, ['update_post_term_cache' => false]);
            if (!$items) {
                return new WP_REST_Response(['items' => []], 200);
            }
            $home_url = home_url('/');
            $out = array_map(function ($item) use ($home_url) {
                return [
                    'id'       => (int) $item->ID,
                    'parent'   => (int) $item->menu_item_parent,
                    'order'    => (int) $item->menu_order,
                    'title'    => html_entity_decode($item->title, ENT_QUOTES),
                    'url'      => $item->url,
                    'isExternal' => (stripos($item->url, $home_url) !== 0),
                    'attr'     => [
                        'target'  => $item->target,
                        'rel'     => $item->xfn,
                        'classes' => implode(' ', array_filter((array) $item->classes)),
                    ],
                    'type'     => $item->type,
                    'object'   => $item->object,
                    'objectId' => (int) $item->object_id,
                ];
            }, $items);
            return new WP_REST_Response(['items' => $out], 200);
        }
    ));

    // Version endpoint for a menu location: returns a stable hash to detect changes client-side
    register_rest_route('nk/v1', '/menu-version/(?P<location>[a-zA-Z0-9_-]+)', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function (WP_REST_Request $req) {
            $location = sanitize_key($req['location']);
            $locations = get_nav_menu_locations();
            if (empty($locations[$location])) {
                return new WP_REST_Response(['version' => null], 200);
            }
            $menu_id = (int) $locations[$location];
            $items = wp_get_nav_menu_items($menu_id, ['update_post_term_cache' => false]);
            if (!$items) {
                return new WP_REST_Response(['version' => null], 200);
            }
            // Build a minimal representation to hash (ids, parent, order, title, url)
            $repr = array_map(function ($i) {
                return [
                    (int) $i->ID,
                    (int) $i->menu_item_parent,
                    (int) $i->menu_order,
                    (string) $i->title,
                    (string) $i->url,
                ];
            }, $items);
            // Stable sort by order then ID to avoid random ordering differences
            usort($repr, function ($a, $b) {
                if ($a[2] === $b[2]) return $a[0] <=> $b[0];
                return $a[2] <=> $b[2];
            });
            $payload = wp_json_encode($repr);
            $hash = hash('sha256', $payload);
            return new WP_REST_Response(['version' => $hash], 200);
        }
    ));
});