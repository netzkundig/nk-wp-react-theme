import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import PrimaryMenu from './PrimaryMenu';
import { SvgIcon } from './utils';
import { IconButton } from './utils';

class Header extends Component {
    state = {
        menuCollapsed: true,
        isWide: false,
    };

    toggleMenu = () => {
        this.setState((prev) => ({ menuCollapsed: !prev.menuCollapsed }));
    };

    syncBodyTheme = () => {
        const { lightTheme } = this.props;
        const body = document?.body;
        if (!body) return;
        // Toggle explicit classes
        body.classList.toggle('theme-light', !!lightTheme);
        body.classList.toggle('theme-dark', !lightTheme);
        // Also expose as data attribute so CSS can target [data-theme="dark"]
        if (lightTheme) {
            body.removeAttribute('data-theme');
        } else {
            body.setAttribute('data-theme', 'dark');
        }
    };

    componentDidMount() {
        this.syncBodyTheme();
        this.updateIsWide();
        window.addEventListener('resize', this.updateIsWide);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lightTheme !== this.props.lightTheme) {
            this.syncBodyTheme();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateIsWide);
    }

    getBreakpointPx = () => {
        try {
            const root = document.documentElement;
            const val = getComputedStyle(root).getPropertyValue('--breakpoint-md').trim();
            if (!val) return 768; // fallback
            if (val.endsWith('px')) return parseFloat(val);
            if (val.endsWith('rem')) {
                const rem = parseFloat(val);
                const fs = parseFloat(getComputedStyle(root).fontSize || '16');
                return rem * fs;
            }
            // generic number fallback
            const n = parseFloat(val);
            return Number.isFinite(n) ? n : 768;
        } catch (_e) {
            return 768;
        }
    };

    updateIsWide = () => {
        const bp = this.getBreakpointPx();
        const wide = window.innerWidth >= bp;
        if (this.state.isWide !== wide) this.setState({ isWide: wide });
    };

    render() {
        const { toggleTheme, lightTheme } = this.props;
        const { menuCollapsed, isWide } = this.state;
        const siteUrl = (window.nkReactTheme?.siteUrl) || '/';
        const siteTitle = (window.nkReactTheme?.siteTitle) || __('NK React Theme', 'nk-react');
        const headerStyle = {
            paddingTop: 'var(--wp--preset--spacing--30)',
            paddingBottom: 'var(--wp--preset--spacing--30)',
            background: lightTheme ? 'var(--wp--preset--color--base)': 'var(--wp--preset--color--contrast)',
            color: lightTheme ? 'var(--wp--preset--color--contrast)': 'var(--wp--preset--color--base)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        };
        // Build responsive menu state classes
        // Above breakpoint: never use 'is-menu-expanded'; treat as collapsed to avoid mobile toggle styles
        const headerStateClass = (() => {
            if (menuCollapsed) return ' is-menu-collapsed';
            if (isWide) return ' is-menu-collapsed';
            return ' is-menu-expanded';
        })();

        return (
            <header
                style={headerStyle}
                className={`site-header has-global-padding${headerStateClass}`}
            >
                <a href={siteUrl} rel="home" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {siteTitle}
                </a>
                <PrimaryMenu />
                <div className="site-header__buttons">
                    <IconButton iconName={"styles"} title={__('Switch Style', 'nk-react')} ariaLabel={__('Switch Style', 'nk-react')} onClick={toggleTheme}>
                        {lightTheme ? __('Dark Mode', 'nk-react') : __('Light Mode', 'nk-react')}
                    </IconButton>
                    <IconButton iconName={"menu"} title={__('Toggle Menu', 'nk-react')} className="menu-toggle" ariaLabel={__('Menu', 'nk-react')} aria-controls="primary-menu" aria-expanded={menuCollapsed ? 'false' : 'true'} onClick={this.toggleMenu}>
                        {__('Menu', 'nk-react')}
                    </IconButton>
                </div>
            </header>
        );
    }
}
export default Header;