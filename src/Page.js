import React, { useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import BlockBodyClass from './utils/BlockBodyClass';
import { initGravityForms } from './utils/initGravityForms';
import { useWPPage } from './utils/wpSWR';

const Page = ({ id, ariaBusy }) => {
  const { data, loading, revalidating, error } = useWPPage(id);

  // Hooks must be declared unconditionally at top level
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      initGravityForms(contentRef.current);
    }
  }, [data?.content?.rendered]);


  if (loading && !data) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label={__('Page is loading', 'nk-react')} />
    </div>
  );
  if (error) return <div>{__('Error while loading the page', 'nk-react')}</div>;
  if (!data) return null;

  document.title = `${data.title?.rendered || 'Seite'} – ${window.nkReactTheme?.siteTitle || ''}`;

  return (
    <>
      <BlockBodyClass blockNames={data.blockNames || []} />
      <article className='wp-block-group alignfull has-global-padding is-layout-constrained wp-block-group-is-layout-constrained' aria-busy={(ariaBusy || revalidating) ? 'true' : undefined}>
        <h1 className='wp-block-post-title' dangerouslySetInnerHTML={{ __html: data.title.rendered }} />
        <div
          className='entry-content alignfull wp-block-post-content has-global-padding is-layout-constrained wp-block-post-content-is-layout-constrained'
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: data.content.rendered }}
        />
      </article>
    </>
  );
};

export default Page;
