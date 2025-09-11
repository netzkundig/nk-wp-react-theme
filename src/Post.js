import React, { useEffect, useRef, useState } from 'react';
import { initGravityForms } from './utils/initGravityForms';

const Post = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/wp-json/wp/v2/posts/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(json => { if (active) setData(json); })
      .catch(() => { if (active) setErr('Fehler beim Laden des Beitrags'); })
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

  if (loading) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label="Beitrag wird geladen" />
    </div>
  );
  if (err) return <div>{err}</div>;
  if (!data) return null;

  document.title = `${data.title?.rendered || 'Beitrag'} – ${window.nkReactTheme?.siteTitle || ''}`;

  return (
    <article className='wp-block-group alignfull has-global-padding is-layout-constrained wp-block-group-is-layout-constrained'>
      <h1 className='wp-block-post-title' dangerouslySetInnerHTML={{ __html: data.title.rendered }} />
      <div ref={contentRef} dangerouslySetInnerHTML={{ __html: data.content.rendered }} />
    </article>
  );
};

export default Post;
