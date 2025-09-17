import React from 'react';
import { useLocation } from 'react-router-dom';
import Home from '../Home';
import Page from '../Page';
import Post from '../Post';
import NotFound from '../NotFound';
import { useResolvePath } from './wpSWR';
import { __ } from '@wordpress/i18n';

const RouteResolver = ({ bootstrap = {} }) => {
  const location = useLocation();
  const { data: route, loading, revalidating, error } = useResolvePath(location.pathname || '/');

  if (loading && !route) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label={__('Content is loading', 'nk-react')} />
    </div>
  );
  // SWR-conform: If we have a cached route, render it even if error occurred during revalidation
  if (error && !route) return <div>{__('Error during route resolution', 'nk-react')}</div>;
  if (!route) return <div>{__('Unknown route', 'nk-react')}</div>;

  const content = (() => {
    switch (route.type) {
      case 'front-page':
        return <Page id={route.id} ariaBusy={revalidating} />;
      case 'home':
        return <Home ariaBusy={revalidating} />;
      case 'page':
        return <Page id={route.id} ariaBusy={revalidating} />;
      case 'post':
        return <Post id={route.id} ariaBusy={revalidating} />;
      default:
        return <NotFound ariaBusy={revalidating} />;
    }
  })();

  // Return content directly to preserve Gutenberg alignfull/alignwide behavior
  return content;
};

export default RouteResolver;