<?php
/**
 * Theme Supports configuration for NK React Theme
 *
 * @package nk-react
 * @license GPL-2.0-or-later
 */

namespace NkReact\Theme\Supports;

/**
 * Default supports list. You can filter via `nkreact/theme_supports` to customize.
 *
 * Each item can be either:
 * - a string: feature name passed to add_theme_support(feature)
 * - an array: [featureName, args] mapped to add_theme_support(featureName, args)
 */
function get_default_supports(): array
{
	return [
		// Core block styles and features
		'wp-block-styles',
		'editor-styles',
		'responsive-embeds',
		// Explicit HTML5 support feature list
		['html5', [
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		]],
		['post-thumbnails', true],
	];
}

/**
 * Initialize theme supports.
 * Allows overriding the list via `nkreact/theme_supports` filter.
 * Optionally sets content width and loads an editor stylesheet.
 */
function setup(): void
{
	\add_action('after_setup_theme', function () {
		$supports = \apply_filters('nkreact/theme_supports', get_default_supports());

		foreach ($supports as $entry) {
			if (\is_string($entry)) {
				\add_theme_support($entry);
			} elseif (\is_array($entry) && isset($entry[0])) {
				$feature = $entry[0];
				$args = $entry[1] ?? null;
				if ($args === null) {
					\add_theme_support($feature);
				} else {
					\add_theme_support($feature, $args);
				}
			}
		}

		// Optional: editor stylesheet
		$editor_style = (string) \apply_filters('nkreact/editor_style', '/build/app.css');
		if ($editor_style) {
			// Uses theme root-relative path
			\add_editor_style($editor_style);
		}
	});
}

// Auto-run setup when this file is included.
setup();
