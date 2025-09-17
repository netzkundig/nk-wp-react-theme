import React, { useEffect } from 'react';

/**
 * BlockBodyClass (generalized)
 * Adds a body class for every encountered Gutenberg block name (from REST field `blockNames`).
 * - Transformation: 'namespace/block' → 'has-block-namespace-block' (slashes → dashes)
 * - All classes are added on mount/update and removed on cleanup.
 *
 * Props:
 *  - blockNames: string[] (e.g. ['core/paragraph','core/embed'])
 */
const BlockBodyClass = ({ blockNames = [] }) => {
  useEffect(() => {
    if (!Array.isArray(blockNames) || blockNames.length === 0) {
      return; // nothing to do
    }
    // Deduplicate and transform to CSS classes
    const classes = Array.from(new Set(blockNames))
      .map((name) => `has-block-${String(name).replace(/\//g, '-')}`);

    classes.forEach((cls) => document.body.classList.add(cls));
    return () => {
      classes.forEach((cls) => document.body.classList.remove(cls));
    };
  }, [blockNames]);

  return null; // purely side-effect component
};

export default BlockBodyClass;
