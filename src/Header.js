import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import PrimaryMenu from './PrimaryMenu';
import { SvgIcon } from './utils';
import { IconButton } from './utils';

class Header extends Component {
    state = {
        menuCollapsed: true,
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
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lightTheme !== this.props.lightTheme) {
            this.syncBodyTheme();
        }
    }

    render() {
        const { toggleTheme, lightTheme } = this.props;
        const { menuCollapsed } = this.state;
        const headerStyle = {
            paddingTop: 'var(--wp--preset--spacing--30)',
            paddingBottom: 'var(--wp--preset--spacing--30)',
            background: lightTheme ? 'var(--wp--preset--color--base)': 'var(--wp--preset--color--contrast)',
            color: lightTheme ? 'var(--wp--preset--color--contrast)': 'var(--wp--preset--color--base)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        };
        return (
            <header
                style={headerStyle}
                className={`site-header has-global-padding${menuCollapsed ? ' is-menu-collapsed' : ' is-menu-expanded'}`}
            >
                <div>{__('NK React Theme', 'nk-react')}</div>
                <PrimaryMenu />
                <div className="site-header__buttons">
                    <IconButton iconName={"styles"} title={__('Switch Style', 'nk-react')} ariaLabel={__('Switch Style', 'nk-react')} onClick={toggleTheme}>
                        {lightTheme ? __('Dark Mode', 'nk-react') : __('Light Mode', 'nk-react')}
                    </IconButton>
                    <button
                        type="button"
                        className="menu-toggle"
                        aria-controls="primary-menu"
                        aria-expanded={menuCollapsed ? 'false' : 'true'}
                        onClick={this.toggleMenu}
                    >
                        {__('Menu', 'nk-react')}
                    </button>
                </div>
            </header>
        );
    }
}
export default Header;