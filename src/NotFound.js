import React from 'react';
import { __ } from '@wordpress/i18n';

const NotFound = ({ ariaBusy }) => {
  document.title = `404 – ${window.nkReactTheme?.siteTitle || ''}`;
  return <div aria-busy={ariaBusy ? 'true' : undefined}>{__('Page not found.', 'nk-react')}</div>;
};

export default NotFound;