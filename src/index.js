import * as wpElement from '@wordpress/element';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const container = document.getElementById('app');
const bootstrap = window.nkReactTheme || {};

const appTree = wpElement.createElement(
  BrowserRouter,
  null,
  wpElement.createElement(App, { bootstrap })
);

if (!container) {
  console.error('Element mit ID "app" nicht gefunden.');
} else if (typeof wpElement.createRoot === 'function') {
  const root = wpElement.createRoot(container);
  root.render(appTree);
} else if (typeof wpElement.render === 'function') {
  wpElement.render(appTree, container);
} else {
  console.error('Weder createRoot noch render ist in @wordpress/element verfügbar.');
}
