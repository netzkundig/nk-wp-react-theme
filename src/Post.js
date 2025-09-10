import React, { useEffect, useState } from 'react';

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

  if (loading) return <div>Lade Beitrag...</div>;
  if (err) return <div>{err}</div>;
  if (!data) return null;

  document.title = `${data.title?.rendered || 'Beitrag'} – ${window.nkReactTheme?.siteTitle || ''}`;

  return (
    <article>
      <h1 dangerouslySetInnerHTML={{ __html: data.title.rendered }} />
      <div dangerouslySetInnerHTML={{ __html: data.content.rendered }} />
    </article>
  );
};

export default Post;