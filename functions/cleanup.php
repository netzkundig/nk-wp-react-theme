<?php
namespace NkReact\Theme\Cleanup;
/**
 * Cleanup Wordpress Clutter: Include cleanup of wp_head and other elements. 
 * Move this to a MU-plugin to keep it active when switching themes.
 * 
 * @package nk-react
 * @license GPL-2.0-or-later
 * @link    https://netzkundig.com/
 */

// Remove unnecessary elements from wp_head
\remove_action('wp_head', 'rsd_link');                         // Remove Really Simple Discovery link
\remove_action('wp_head', 'wlwmanifest_link');                 // Remove Windows Live Writer link
\remove_action('wp_head', 'wp_generator');                     // Remove WordPress version
\remove_action('wp_head', 'feed_links', 2);                    // Remove RSS feed links
\remove_action('wp_head', 'feed_links_extra', 3);              // Remove extra RSS feed links
\remove_action('wp_head', 'index_rel_link');                   // Remove index link
\remove_action('wp_head', 'parent_post_rel_link', 10, 0);       // Remove previous link
\remove_action('wp_head', 'start_post_rel_link', 10, 0);        // Remove start link
\remove_action('wp_head', 'adjacent_posts_rel_link', 10, 0);     // Remove relational links for adjacent posts
\remove_action('wp_head', 'wp_shortlink_wp_head', 10, 0); // Remove shortlink
\remove_action('wp_head', 'rest_output_link_wp_head', 10);     // Remove REST API link
\remove_action('wp_head', 'wp_oembed_add_discovery_links');        // Remove oEmbed discovery links
\remove_action('wp_head', 'print_emoji_detection_script', 7); // Remove emoji script
\remove_action('wp_print_styles', 'print_emoji_styles');       // Remove emoji styles