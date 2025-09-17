import React, { Component } from 'react';

class Footer extends Component {
    render() {
        const { lightTheme } = this.props;
        const footerStyle = {
            backgroundColor: lightTheme ? 'var(--wp--preset--color--base)' : 'var(--wp--preset--color--contrast)',
            color: lightTheme ? 'var(--wp--preset--color--contrast)' : 'var(--wp--preset--color--base)',
            paddingTop: 'var(--wp--preset--spacing--30)',
            paddingBottom: 'var(--wp--preset--spacing--30)',
            marginTop: 'unset',
            textAlign: 'center',
        };
        return (
            <footer style={footerStyle} className='has-global-padding'>
                © {new Date().getFullYear()} NK React Theme
            </footer>
        );
    }
}

export default Footer;