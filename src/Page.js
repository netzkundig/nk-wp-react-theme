import React, { useEffect, useRef, useState } from 'react';
import { initGravityForms } from './utils/initGravityForms';

const Page = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/wp-json/wp/v2/pages/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(json => { if (active) setData(json); })
      .catch(() => { if (active) setErr('Fehler beim Laden der Seite'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  // Hooks must be declared unconditionally at top level
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      initGravityForms(contentRef.current);
    }
  }, [data?.content?.rendered]);

  if (loading) return <div>Lade Seite...</div>;
  if (err) return <div>{err}</div>;
  if (!data) return null;

  document.title = `${data.title?.rendered || 'Seite'} – ${window.nkReactTheme?.siteTitle || ''}`;

  return (
    <article>
      <h1 dangerouslySetInnerHTML={{ __html: data.title.rendered }} />
      <div ref={contentRef} dangerouslySetInnerHTML={{ __html: data.content.rendered }} />
    </article>
  );
};

export default Page;
