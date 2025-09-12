<?php
/**
 * Register Menus for NK React Theme
 * @package nk-react
 * @license GPL-2.0-or-later
 * @link    https://netzkundig.com/
 */

// Register navigation menus
add_action('after_setup_theme', function () {
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'nk-react'),
        'footer'  => __('Footer Menu', 'nk-react'),
    ));
});