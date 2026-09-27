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
  // 保留脚注的 id、ARIA 与 data 属性，让编号和返回链接在当前页跳转。
  if (href.startsWith('#')) {
    return <a {...props} href={href}>{children}</a>;
  }
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
