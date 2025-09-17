import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import PrimaryMenu from './PrimaryMenu';

class Header extends Component {
    render() {
        const { toggleTheme, lightTheme } = this.props;
        console.log('Header Theme:', lightTheme);
        const headerStyle = {
            background: lightTheme ? 'var(--wp--preset--color--base)': 'var(--wp--preset--color--contrast)',
            color: lightTheme ? 'var(--wp--preset--color--contrast)': 'var(--wp--preset--color--base)',
            padding: 'var(--wp--preset--spacing--20) var(--wp--preset--spacing--30)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        };
        return (
            <header style={headerStyle}>
                <div>{__('NK React Theme', 'nk-react')}</div>
                <PrimaryMenu />
                <button onClick={toggleTheme}>{lightTheme ? __('Dark Mode', 'nk-react') : __('Light Mode', 'nk-react')}</button>
            </header>
        );
    }
}
export default Header;