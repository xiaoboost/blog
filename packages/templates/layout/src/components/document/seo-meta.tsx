import { useRenderContext } from '@blog/context/runtime';
import { toAbsoluteUrl } from '@blog/shared';
import React from 'react';
import type { DocumentProps } from '.';

export function SeoMeta({
  author,
  description,
  keywords,
  noIndex,
}: DocumentProps) {
  const { site, page } = useRenderContext();
  const canonicalUrl = toAbsoluteUrl(site.origin, page.pathname);
  const metaAuthor = author ?? site.author;
  const metaDescription = description ?? site.description;

  return (
    <>
      <title>{page.title}</title>
      {noIndex
        ? <meta name="robots" content="noindex" />
        : <link rel="canonical" href={canonicalUrl} />}
      {metaAuthor && <meta name="author" content={metaAuthor} />}
      {metaDescription && <meta name="description" content={metaDescription} />}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(',')} />
      )}
    </>
  );
}
