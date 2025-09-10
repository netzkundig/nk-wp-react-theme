import React from 'react';

const NotFound = () => {
  document.title = `404 – ${window.nkReactTheme?.siteTitle || ''}`;
  return <div>Seite nicht gefunden.</div>;
};

export default NotFound;