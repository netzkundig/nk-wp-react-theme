import React, { useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import BlockBodyClass from './utils/BlockBodyClass';
import { initGravityForms } from './utils/initGravityForms';
import { useWPPost } from './utils/wpSWR';
import { setupLinkInterception } from './utils/interceptLinks';
import { useNavigate } from 'react-router-dom';

const Post = ({ id, ariaBusy }) => {
  const { data, loading, revalidating, error } = useWPPost(id);

  // Hooks must be declared unconditionally at top level
  const contentRef = useRef(null);

  const navigate = useNavigate();
  useEffect(() => {
    if (!contentRef.current) return;
    initGravityForms(contentRef.current);
    const teardown = setupLinkInterception(contentRef.current, navigate);
    return () => { if (typeof teardown === 'function') teardown(); };
  }, [data?.content?.rendered, navigate]);

  if (loading && !data) return (
    <div className="nk-spinner-wrapper">
      <div className="nk-spinner" aria-label={__('Post is loading', 'nk-react')} />
    </div>
  );
  if (error) return <div>{__('Error while loading the post', 'nk-react')}</div>;
  if (!data) return null;

  document.title = `${data.title?.rendered || 'Beitrag'} – ${window.nkReactTheme?.siteTitle || ''}`;

  return (
    <>
      <BlockBodyClass blockNames={data.blockNames || []} />
      <article className='wp-block-group alignfull has-global-padding is-layout-constrained wp-block-group-is-layout-constrained' aria-busy={(ariaBusy || revalidating) ? 'true' : undefined}>
        <h1 className='wp-block-post-title' dangerouslySetInnerHTML={{ __html: data.title.rendered }} />
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: data.content.rendered }} />
      </article>
    </>
  );
};

export default Post;
