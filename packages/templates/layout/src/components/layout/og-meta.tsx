import React from 'react';
import type { LayoutProps } from '.';

export function OgMeta({
  pageTitle,
  siteTitle,
  pathname,
  author,
  description,
  keywords,
}: LayoutProps) {
  return (
    <>
      <meta property="og:title" content={pageTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={pathname} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="zh_CN" />
      {author && <meta property="article:author" content={author} />}
      {(keywords ?? []).length > 0 && (
        <meta property="article:tag" content={keywords?.join(',')} />
      )}
    </>
  );
}
