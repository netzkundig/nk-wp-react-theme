import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Home from './Home';
import Page from './Page';
import Post from './Post';
import NotFound from './NotFound';

const RouteResolver = ({ bootstrap = {} }) => {
  const location = useLocation();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolve = async (path) => {
    const base = (bootstrap.siteUrl || '').replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/wp-json/nk/v1/resolve?path=${encodeURIComponent(path)}`, {
        credentials: 'same-origin',
      });
      const data = await res.json();
      setRoute(data);
    } catch (e) {
      setRoute({ type: '404' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    resolve(location.pathname || '/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (loading) return <div>Lade...</div>;
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