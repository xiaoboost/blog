import { useRenderContext } from '@blog/context/runtime';
import { imageMeta } from 'image-meta';
import React from 'react';
import defaultImagePath from '../../assets/images/og-default.jpg';
import defaultImageSource from '../../assets/images/og-default.jpg?raw';
import { toAbsoluteUrl } from './absolute-url';
import type { LayoutProps } from '.';

const defaultImageMetadata = imageMeta(defaultImageSource);
const {
  width: defaultImageWidth,
  height: defaultImageHeight,
  type: defaultImageFormat,
} = defaultImageMetadata;

if (!defaultImageWidth || !defaultImageHeight || !defaultImageFormat) {
  throw new TypeError('无法读取默认 OG 图片的类型或尺寸');
}

const defaultImageType = defaultImageFormat === 'jpg'
  ? 'image/jpeg'
  : `image/${defaultImageFormat}`;

export function OgMeta({
  pageTitle,
  siteTitle,
  pathname,
  description,
  keywords,
  publishedTime,
  modifiedTime,
}: LayoutProps) {
  const { page, site } = useRenderContext();
  const url = toAbsoluteUrl(site.origin, pathname);
  const image = toAbsoluteUrl(site.origin, defaultImagePath);
  const metaDescription = description ?? site.description ?? siteTitle;
  const imageAlt = `${siteTitle} 社交分享图`;
  const isArticle = page.type === 'post';

  return (
    <>
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={isArticle ? 'article' : 'website'} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="zh_CN" />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:type" content={defaultImageType} />
      <meta property="og:image:width" content={String(defaultImageWidth)} />
      <meta property="og:image:height" content={String(defaultImageHeight)} />
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
