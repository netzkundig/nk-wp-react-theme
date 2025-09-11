import React, { Component } from 'react';

class Footer extends Component {
    render() {
        const { lightTheme } = this.props;
        const footerStyle = {
            backgroundColor: lightTheme ? 'var(--wp--preset--color--base)' : 'var(--wp--preset--color--contrast)',
            color: lightTheme ? 'var(--wp--preset--color--contrast)' : 'var(--wp--preset--color--base)',
            padding: 'var(--wp--preset--spacing--30)',
            textAlign: 'center',
        };
        return (
            <footer style={footerStyle}>
                © {new Date().getFullYear()} NK React Theme
            </footer>
        );
    }
}

export default Footer;