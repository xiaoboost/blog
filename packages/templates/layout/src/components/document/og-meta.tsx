import { useRenderContext } from '@blog/context/runtime';
import { toAbsoluteUrl } from '@blog/shared';
import React from 'react';
import { ogImageMetadata, useOgImage } from './og-image';
import type { DocumentProps } from '.';

export function OgMeta({
  description,
  coverImage,
  keywords,
  publishedTime,
  modifiedTime,
}: DocumentProps) {
  const { page, site } = useRenderContext();
  const imagePath = useOgImage(coverImage);
  const url = toAbsoluteUrl(site.origin, page.pathname);

  if (!imagePath) {
    return null;
  }

  const image = toAbsoluteUrl(site.origin, imagePath);
  const imageAlt = page.title ?? site.title;
  const metaDescription = description ?? site.description ?? site.title;
  const isArticle = page.type === 'post';

  return (
    <>
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={isArticle ? 'article' : 'website'} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={site.title} />
      <meta property="og:locale" content="zh_CN" />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:type" content={ogImageMetadata.mimeType} />
      <meta property="og:image:width" content={String(ogImageMetadata.width)} />
      <meta property="og:image:height" content={String(ogImageMetadata.height)} />
      <meta property="og:image:alt" content={imageAlt} />
      {isArticle && site.authorUrl && (
        <meta property="article:author" content={site.authorUrl} />
      )}
      {isArticle && publishedTime != null && (
        <meta property="article:published_time" content={new Date(publishedTime).toISOString()} />
      )}
      {isArticle && modifiedTime != null && (
        <meta property="article:modified_time" content={new Date(modifiedTime).toISOString()} />
      )}
      {isArticle && (keywords ?? []).map((keyword) => (
        <meta key={keyword} property="article:tag" content={keyword} />
      ))}
    </>
  );
}
