import React, { useEffect, useMemo, useState } from 'react';

// Very small cache to avoid re-fetching the same SVG multiple times
const svgCache = new Map(); // key: url, value: string (svg markup)

// Basic allow-list sanitizer for inline SVGs
function sanitizeSvg(svg) {
  // Remove scripts and event handlers
  let cleaned = String(svg)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/on[a-z]+\s*=\s*[^\s>]+/gi, '');

  // Optionally remove any xmlns:xlink to avoid issues
  cleaned = cleaned.replace(/\s+xmlns:xlink="[^"]*"/gi, '');

  // Ensure role/presentation isn't overridden unexpectedly – we keep content as-is here
  return cleaned;
}

// If the root <svg> has no explicit width/height, add width="100%" height="100%"
function ensureResponsiveSvg(svg) {
  return String(svg).replace(/<svg([^>]*)>/i, (match, attrs) => {
    const hasWidth = /\bwidth\s*=/.test(attrs);
    const hasHeight = /\bheight\s*=/.test(attrs);
    let newAttrs = attrs;
    if (!hasWidth) newAttrs += ' width="100%"';
    if (!hasHeight) newAttrs += ' height="100%"';
    return `<svg${newAttrs}>`;
  });
}

/**
 * SvgIcon utility
 *
 * Props:
 *  - src?: string           // absolute or relative url to .svg
 *  - iconName?: string      // basename under assets/svg (e.g. 'logo') resolves to `${assetsBase}/${iconName}.svg`
 *  - name?: string          // DEPRECATED alias for iconName (kept for backward compatibility)
 *  - assetsBase?: string    // base path for named svgs (default: '/wp-content/themes/nk-react/assets/svg')
 *  - title?: string         // accessible title
 *  - decorative?: boolean   // if true, hides from a11y tree (aria-hidden)
 *  - className?: string
 *  - style?: React.CSSProperties
 *
 * Either provide src or iconName.
 */
export default function SvgIcon({ src, iconName, name, assetsBase = '/wp-content/themes/nk-react/assets/svg', title, decorative = false, className, style }) {
  const url = useMemo(() => {
    if (src) return src;
    // Prefer new prop iconName; fall back to deprecated name
    const resolvedName = iconName || name;
    if (resolvedName) return `${assetsBase.replace(/\/$/, '')}/${resolvedName}.svg`;
    return null;
  }, [src, iconName, name, assetsBase]);

  const [markup, setMarkup] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    if (!url) return;

    async function load() {
      try {
        if (svgCache.has(url)) {
          if (active) setMarkup(svgCache.get(url));
          return;
        }
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Failed to load SVG: ${res.status}`);
        const text = await res.text();
        const safe = sanitizeSvg(text);
        const responsive = ensureResponsiveSvg(safe);
        svgCache.set(url, responsive);
        if (active) setMarkup(responsive);
      } catch (e) {
        if (active) setError(e);
      }
    }
    load();
    return () => { active = false; };
  }, [url]);

  if (!url) return null;
  if (error) return null; // Silently fail – or render fallback if desired
  if (!markup) return null; // or a spinner placeholder

  const ariaProps = decorative
    ? { 'aria-hidden': 'true' }
    : { role: 'img', 'aria-label': title || undefined };

  // We ensure title isn't duplicated – if you need an inner <title>, you can include it in the SVG source
  const mergedStyle = {
    width: '24px',
    height: '24px',
    ...style,
  };

  // Merge additional classnames and always add base class
  const classNames = ['nk-svg-icon'];
  if (className) classNames.push(className);
  const classNameStr = classNames.join(' ');

  return (
    <span
      className={classNameStr}
      style={mergedStyle}
      // ESLint: we deliberately inline sanitized SVG markup
      dangerouslySetInnerHTML={{ __html: markup }}
      {...ariaProps}
    />
  );
}
