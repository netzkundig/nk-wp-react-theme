import React, { useEffect, useState } from 'react';
import BlockBodyClass from './BlockBodyClass';

const Home = () => {

  const [frontPageContent, setFrontPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/wp-json/wp/v2/pages?filter[front_page]=true')
      .then(res => res.json())
      .then(pages => {
        if (Array.isArray(pages) && pages.length > 0) {
          setFrontPageContent(pages[0]);
        } else {
          setError('Keine statische Frontpage definiert oder gefunden.');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Fehler beim Laden der Frontpage');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label="Frontpage wird geladen" />
    </div>
  );
  if (error) return <div>{error}</div>;
  if (!frontPageContent) return <div>Keine statische Frontpage definiert.</div>;

  return (
    <>
      <BlockBodyClass blockNames={frontPageContent.blockNames || []} />
      <article className='wp-block-group alignfull has-global-padding is-layout-constrained wp-block-group-is-layout-constrained'>
        <h1 className='wp-block-post-title'>{frontPageContent.title.rendered}</h1>
        <div className='entry-content alignfull wp-block-post-content has-global-padding is-layout-constrained wp-block-post-content-is-layout-constrained' dangerouslySetInnerHTML={{ __html: frontPageContent.content.rendered }} />
      </article>
    </>
  );
};

export default Home;
