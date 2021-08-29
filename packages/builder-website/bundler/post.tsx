import React from 'react';

import { AssetData } from '@blog/utils';
import { default as posts, PostRendered } from '@blog/posts';

import { createElement } from 'react';
import { Render as Post } from '@blog/template-post';
import { createHtml } from './utils';

const postRender = createHtml(Post);

function getModules(post: PostRendered) {
  // ..
}

function getPostHtml(post: PostRendered) {
  const html = postRender({
    pageTitle: '标题',
    siteTitle: '',
    pathname: '',
    post: {

    },
  });

  debugger;
  console.log(html);
}

function getRefLink(name: string) {
  // ..
}

export function build(): AssetData[] {
  const assets: AssetData[] = [];

  for (const post of posts) {
    const moduleRefs = PostRender({} as any);
    console.log(moduleRefs);
  }

  return assets;
}
