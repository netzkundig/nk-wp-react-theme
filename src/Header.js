import React, { Component } from 'react';
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
                <div>NK React Theme</div>
                <PrimaryMenu />
                <button onClick={toggleTheme}>{lightTheme ? 'Dark Mode' : 'Light Mode'}</button>
            </header>
        );
    }
}
export default Header;