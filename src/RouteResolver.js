import React from 'react';
import { useLocation } from 'react-router-dom';
import Home from './Home';
import Page from './Page';
import Post from './Post';
import NotFound from './NotFound';
import { useResolvePath } from './utils/wpSWR';

const RouteResolver = ({ bootstrap = {} }) => {
  const location = useLocation();
  const { data: route, loading, error } = useResolvePath(location.pathname || '/');

  if (loading) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label="Inhalt wird geladen" />
    </div>
  );
  if (error) return <div>Fehler bei der Routenauflösung</div>;
  if (!route) return <div>Unbekannte Route</div>;

  switch (route.type) {
    case 'front-page':
      return <Page id={route.id} />;
    case 'home':
      return <Home />;
    case 'page':
      return <Page id={route.id} />;
    case 'post':
      return <Post id={route.id} />;
    default:
      return <NotFound />;
  }
};

export default RouteResolver;