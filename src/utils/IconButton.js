import React from 'react';
import SvgIcon from './SvgIcon';

/**
 * IconButton
 * Accessible button with an inline SVG icon and optional text label.
 *
 * Props:
 *  - onClick?: (e) => void
 *  - type?: 'button' | 'submit' | 'reset' (default: 'button')
 *  - className?: string
 *  - style?: React.CSSProperties
 *  - disabled?: boolean
 *  - title?: string               // tooltip title
 *  - ariaLabel?: string           // required if no visible children label provided
 *  - iconName?: string            // SvgIcon name
 *  - iconSrc?: string             // SvgIcon src
 *  - iconSize?: string | number   // CSS size for icon wrapper (default: 1rem)
 *  - iconPosition?: 'left' | 'right' | 'only' (default: 'left')
 *  - assetsBase?: string          // passed to SvgIcon
 *  - decorativeIcon?: boolean     // if true, hides icon from a11y tree
 *  - children?: React.ReactNode   // visible text label, optional when ariaLabel provided
 */
export default function IconButton({
  onClick,
  type = 'button',
  className,
  style,
  disabled,
  title,
  ariaLabel,
  iconName,
  iconSrc,
  iconSize = '24px',
  iconPosition = 'left',
  assetsBase,
  decorativeIcon = true,
  children,
}) {
  const hasVisibleLabel = React.Children.count(children) > 0;
  const computedAriaLabel = !hasVisibleLabel ? ariaLabel : undefined;

  if (!hasVisibleLabel && !computedAriaLabel) {
    // eslint-disable-next-line no-console
    console.warn('IconButton: Provide either visible children as label or an ariaLabel for accessibility.');
  }

  const cls = ['nk-icon-button'];
  if (className) cls.push(className);

  const iconEl = (
    <span className="nk-icon-button__icon" style={{ width: iconSize, height: iconSize }} aria-hidden={decorativeIcon ? 'true' : undefined}>
      <SvgIcon name={iconName} src={iconSrc} assetsBase={assetsBase} decorative={decorativeIcon} />
    </span>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      className={cls.join(' ')}
      style={style}
      disabled={disabled}
      title={title}
      aria-label={computedAriaLabel}
    >
      {iconPosition === 'left' && iconEl}
      {hasVisibleLabel && (
        <span className="nk-icon-button__label">{children}</span>
      )}
      {iconPosition === 'right' && iconEl}
      {iconPosition === 'only' && !hasVisibleLabel && iconEl}
    </button>
  );
}
