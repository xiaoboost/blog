import React from 'react';
import type { LayoutProps } from '.';

export function SeoMeta({ pageTitle, author, description, keywords }: LayoutProps) {
  return (
    <>
      <title>{pageTitle}</title>
      {author && <meta name="author" content={author} />}
      {description && <meta name="description" content={description} />}
      {(keywords ?? []).length > 0 && (
        <meta name="keywords" content={keywords?.join(',')} />
      )}
    </>
  );
}
