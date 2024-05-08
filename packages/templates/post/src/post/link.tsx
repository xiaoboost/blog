import React from 'react';
import { forEach } from '@blog/context/runtime';
import { normalize } from '@blog/node';
import type { PostBasicData } from '@blog/types';

export interface Props {
  href: string;
  children?: string;
}

const postPathMap = new Map<string, PostBasicData>();

forEach((runtime) => {
  runtime.hooks.afterPostDataReady.tap('component-link', (posts) => {
    postPathMap.clear();
    posts.forEach((post) => postPathMap.set(post.filePath, post));
  });
});

export function Link(post: PostBasicData) {
  return function a({ href, children }: Props) {
    if (href.startsWith('.')) {
      const fullPath = normalize(post.filePath, '..', decodeURIComponent(href));
      const linkPost = postPathMap.get(fullPath);

      if (linkPost) {
        return React.createElement(
          'a',
          {
            target: '_blank',
            rel: 'noreferrer',
            title: children,
            href: linkPost.pathname,
          },
          [`《${linkPost.title}》`],
        );
      }
    }

    return (
      <a target='_blank' rel='noreferrer' href={href}>
        {children}
      </a>
    );
  };
}
