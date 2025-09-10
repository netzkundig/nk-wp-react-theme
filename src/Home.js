import React, { useEffect, useState } from 'react';

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

  if (loading) return <div>Lade...</div>;
  if (error) return <div>{error}</div>;
  if (!frontPageContent) return <div>Keine statische Frontpage definiert.</div>;

  return (
    <div>
      <h1>{frontPageContent.title.rendered}</h1>
      <div dangerouslySetInnerHTML={{ __html: frontPageContent.content.rendered }} />
    </div>
  );
};

export default Home;
