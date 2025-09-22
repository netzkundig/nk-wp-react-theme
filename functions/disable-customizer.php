<?php
/**
 * Disable WordPress Customizer for this theme.
 *
 * Blocks access to /wp-admin/customize.php, removes menu/toolbar entries,
 * and prevents related scripts from loading.
 *
 * @package nk-react
 */

namespace NkReact\Theme\DisableCustomizer;

// 1) Block capability 'customize'
\add_filter('map_meta_cap', function (array $caps, string $cap, int $user_id) {
	if ($cap === 'customize') {
		return ['do_not_allow'];
	}
	return $caps;
}, 10, 4);

// 2) Remove Customizer from admin menu
\add_action('admin_menu', function () {
	remove_submenu_page('themes.php', 'customize.php');
	// Appearance -> Customize top-level link for non-block themes
	remove_menu_page('customize.php');
}, 999);

// 3) Remove from admin bar
\add_action('admin_bar_menu', function ($wp_admin_bar) {
	if (is_object($wp_admin_bar)) {
		$wp_admin_bar->remove_node('customize');
	}
}, 999);

// 4) Block direct access to the Customizer screen
\add_action('load-customize.php', function () {
	wp_die(__('The Customizer is disabled for this site.', 'nk-react'));
});

// 5) Prevent theme support from enabling selective refresh (already removed in defaults)
//    Kept here as a safeguard if another plugin/theme adds it later.
\add_action('after_setup_theme', function () {
	remove_theme_support('customize-selective-refresh-widgets');
}, 20);
