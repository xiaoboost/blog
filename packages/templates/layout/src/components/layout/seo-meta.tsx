import { useRenderContext } from '@blog/context/runtime';
import React from 'react';
import { toAbsoluteUrl } from './absolute-url';
import type { LayoutProps } from '.';

export function SeoMeta({ pageTitle, pathname, author, description, keywords }: LayoutProps) {
  const { site } = useRenderContext();
  const canonicalUrl = toAbsoluteUrl(site.origin, pathname);
  const metaAuthor = author ?? site.author;
  const metaDescription = description ?? site.description;

  return (
    <>
      <title>{pageTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      {metaAuthor && <meta name="author" content={metaAuthor} />}
      {metaDescription && <meta name="description" content={metaDescription} />}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(',')} />
      )}
    </>
  );
}
