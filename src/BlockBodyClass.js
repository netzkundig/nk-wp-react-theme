import React, { useEffect } from 'react';

// Default mapping: Gutenberg block name -> body class to apply
const DEFAULT_MAPPING = {
  'core/embed': 'wp-embed-responsive'
};

/**
 * BlockBodyClass
 * Adds body classes based on presence of block names (REST field `blockNames`).
 * - Accepts a list of block names returned by the WP REST API.
 * - Applies mapped classes when a matching block exists.
 * - Cleans up (removes the classes) when dependencies change or component unmounts.
 *
 * Props:
 *  - blockNames: string[] (array of block names e.g. ['core/paragraph','core/embed'])
 *  - mapping:   { [blockName: string]: string } (optional override / extension)
 */
const BlockBodyClass = ({ blockNames = [], mapping = DEFAULT_MAPPING }) => {
  useEffect(() => {
    if (!Array.isArray(blockNames) || blockNames.length === 0) {
      return; // nothing to do
    }
    const added = [];
    Object.entries(mapping).forEach(([block, cls]) => {
      if (blockNames.includes(block) && cls) {
        document.body.classList.add(cls);
        added.push(cls);
      }
    });
    return () => {
      added.forEach(c => document.body.classList.remove(c));
    };
  }, [blockNames, mapping]);

  return null; // purely side-effect component
};

export default BlockBodyClass;
