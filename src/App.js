import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import RouteResolver from './RouteResolver';

export default class App extends Component {
  state = { darkTheme: true };
  toggleTheme = () => this.setState(prev => ({ darkTheme: !prev.darkTheme }));

  render() {
    const { darkTheme } = this.state;
    const { bootstrap } = this.props;

    return (
      <div>
        <Header darkTheme={darkTheme} toggleTheme={this.toggleTheme} />
        <main style={{ padding: '20px', background: darkTheme ? '#282c34' : '#f5f5f5', color: darkTheme ? 'white' : 'black' }}>
          <Routes>
            <Route path="*" element={<RouteResolver bootstrap={bootstrap} />} />
          </Routes>
        </main>
        <Footer darkTheme={darkTheme} />
      </div>
    );
  }
}