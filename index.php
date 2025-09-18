<?php
/**
 * Main template file for NK React Theme
 * 
 * @package nk-react
 * @license GPL-2.0-or-later
 * @link    https://netzkundig.com/
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php bloginfo('name'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <div id="app" class="wp-site-blocks"></div>
    <?php wp_footer(); ?>
</body>
</html>