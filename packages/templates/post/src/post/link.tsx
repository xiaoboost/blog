import { onBuild, useRenderContext } from '@blog/context/runtime';
import { normalize } from '@blog/node';
import type { PageDataMap, PostBasicData } from '@blog/types';
import React from 'react';

export type Props = React.AnchorHTMLAttributes<HTMLAnchorElement>;

const postPathMap = new Map<string, PostBasicData>();

onBuild((runtime) => {
  runtime.hooks.afterPostDataReady.tap('component-link', (posts) => {
    postPathMap.clear();
    posts.forEach((post) => postPathMap.set(post.filePath, post));
  });
});

export function Link({ href = '', children, ...props }: Props) {
  const { page } = useRenderContext();
  const { post } = page.data as PageDataMap['post'];
  if (href.startsWith('.')) {
    const fullPath = normalize(post.data.filePath, '..', decodeURIComponent(href));
    const linkPost = postPathMap.get(fullPath);

    if (linkPost) {
      return (
        <a
          {...props}
          target="_blank"
          rel="noreferrer"
          title={typeof children === 'string' ? children : undefined}
          href={linkPost.pathname}
        >
          {`《${linkPost.title}》`}
        </a>
      );
    }
  }

  return (
    <a {...props} target="_blank" rel="noreferrer" href={href}>
      {children}
    </a>
  );
}
