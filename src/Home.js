import React, { useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import BlockBodyClass from './BlockBodyClass';
import { useWPPage } from './utils/wpSWR';

const Home = ({ ariaBusy }) => {
  const frontPageId = useMemo(() => window.nkReactTheme?.frontPageId || null, []);
  // If a static front page is set, use it; otherwise fallback via resolve/home logic
  const { data: frontPageContent, loading, revalidating, error } = frontPageId ? useWPPage(frontPageId) : { data: null, loading: false, revalidating: false, error: null };

  if (loading && !frontPageContent) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label={__('Front page is loading', 'nk-react')} />
    </div>
  );
  if (!frontPageId) return <div>{__('No static front page defined.', 'nk-react')}</div>;
  if (error) return <div>{__('Error while loading the front page', 'nk-react')}</div>;
  if (!frontPageContent) return null;

  return (
    <>
      <BlockBodyClass blockNames={frontPageContent.blockNames || []} />
      <article className='wp-block-group alignfull has-global-padding is-layout-constrained wp-block-group-is-layout-constrained' aria-busy={(ariaBusy || revalidating) ? 'true' : undefined}>
        <h1 className='wp-block-post-title'>{frontPageContent.title.rendered}</h1>
        <div className='entry-content alignfull wp-block-post-content has-global-padding is-layout-constrained wp-block-post-content-is-layout-constrained' dangerouslySetInnerHTML={{ __html: frontPageContent.content.rendered }} />
      </article>
    </>
  );
};

export default Home;
