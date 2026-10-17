import { onBuild, useRenderContext } from '@blog/context/runtime';
import { normalize } from '@blog/node';
import type { PageDataMap, PostBasicData } from '@blog/types';
import React from 'react';

import { getHeadingAnchors } from '../to-content/utils';

import { decodeLinkPart, resolveHeadingFragment, splitPostHref } from './link-utils';

export type Props = React.AnchorHTMLAttributes<HTMLAnchorElement>;

const postPathMap = new Map<string, PostBasicData>();
const headingMap = new Map<PostBasicData, ReturnType<typeof getHeadingAnchors>>();

function resolvePostFragment(fragment: string, post: PostBasicData) {
  if (!fragment) {
    return fragment;
  }

  let headings = headingMap.get(post);

  if (!headings) {
    headings = getHeadingAnchors(post.ast);
    headingMap.set(post, headings);
  }

  return resolveHeadingFragment(fragment, headings);
}

onBuild((runtime) => {
  runtime.hooks.afterPostDataReady.tap('component-link', (posts) => {
    postPathMap.clear();
    headingMap.clear();
    posts.forEach((post) => postPathMap.set(post.filePath, post));
  });
});

export function Link({ href = '', children, ...props }: Props) {
  const { page } = useRenderContext();
  const { post } = page.data as PageDataMap['post'];
  const { path, query, fragment } = splitPostHref(href);

  if (href.startsWith('#')) {
    return (
      <a {...props} href={resolvePostFragment(fragment, post.data)}>
        {children}
      </a>
    );
  }

  if (path.startsWith('.')) {
    const fullPath = normalize(post.data.filePath, '..', decodeLinkPart(path));
    const linkPost = postPathMap.get(fullPath);

    if (linkPost) {
      return (
        <a
          {...props}
          target="_blank"
          rel="noreferrer"
          href={`${linkPost.pathname}${query}${resolvePostFragment(fragment, linkPost)}`}
        >
          {children}
        </a>
      );
    }
  }

  return (
    <a
      {...props}
      target="_blank"
      rel="noreferrer"
      href={href}
    >
      {children}
    </a>
  );
}
