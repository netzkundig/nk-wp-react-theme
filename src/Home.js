import React, { useMemo } from 'react';
import BlockBodyClass from './BlockBodyClass';
import { useWPPage } from './utils/wpSWR';

const Home = () => {
  const frontPageId = useMemo(() => window.nkReactTheme?.frontPageId || null, []);
  // If a static front page is set, use it; otherwise fallback via resolve/home logic
  const { data: frontPageContent, loading, revalidating, error } = frontPageId ? useWPPage(frontPageId) : { data: null, loading: false, revalidating: false, error: null };

  if (loading && !frontPageContent) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label="Frontpage wird geladen" />
    </div>
  );
  if (!frontPageId) return <div>Keine statische Frontpage definiert.</div>;
  if (error) return <div>{error}</div>;
  if (!frontPageContent) return null;

  return (
    <>
      <BlockBodyClass blockNames={frontPageContent.blockNames || []} />
      <article className='wp-block-group alignfull has-global-padding is-layout-constrained wp-block-group-is-layout-constrained' aria-busy={revalidating ? 'true' : undefined}>
        <h1 className='wp-block-post-title'>{frontPageContent.title.rendered}</h1>
        <div className='entry-content alignfull wp-block-post-content has-global-padding is-layout-constrained wp-block-post-content-is-layout-constrained' dangerouslySetInnerHTML={{ __html: frontPageContent.content.rendered }} />
      </article>
    </>
  );
};

export default Home;
