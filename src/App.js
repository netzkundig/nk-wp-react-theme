import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RouteResolver from './RouteResolver';

export default class App extends Component {
  state = { lightTheme: true };
  toggleTheme = () => this.setState(prev => ({ lightTheme: !prev.lightTheme }));

  render() {
    const { lightTheme } = this.state;
    const { bootstrap } = this.props;

    return (
        <>
          <Header lightTheme={lightTheme} toggleTheme={this.toggleTheme} />
          <main
            style={{
              marginTop: 'unset',
              background: lightTheme
                ? 'var(--wp--preset--color--base)'
                : 'var(--wp--preset--color--contrast)',
              color: lightTheme
                ? 'var(--wp--preset--color--contrast)'
                : 'var(--wp--preset--color--base)'
            }}
            className='wp-block-group has-global-padding is-layout-constrained wp-block-group-is-layout-constrained'>
            <Routes>
              <Route path="*" element={<RouteResolver bootstrap={bootstrap} />} />
            </Routes>
          </main>
          <Footer lightTheme={lightTheme} />
        </>
    );
  }
}