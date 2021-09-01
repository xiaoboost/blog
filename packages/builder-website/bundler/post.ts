import path from 'path';

import { AssetData } from '@blog/utils';
import { site, publicPath } from '@blog/config';
import { default as posts, PostRendered } from '@blog/posts';
import { PostRender } from '@blog/template-post';
import { createHtml } from './utils';

function getPostHtml(post: PostRendered) {
  const createPost = createHtml(PostRender);
  const html = createPost({
    pageTitle: post.title,
    siteTitle: site.title,
    pathname: post.pathname,
    author: site.author,
    description: post.description,
    publicPath: publicPath,
    styles: [],
    scripts: [],
    post: post,
  });

  return html;
}

function build(): AssetData[] {
  const assets: AssetData[] = [];

  for (const post of posts) {
    assets.push({
      path: path.join('/', post.pathname, 'index.html'),
      contents: getPostHtml(post),
    });
  }

  return assets;
}

export const assets = build();
