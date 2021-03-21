import type { PostData } from '../plugins/loader-md';
import type { Template } from './template';

import { Markdown } from '../markdown';
import { toPinyin } from '../utils';

import { publicPath } from '../config/project';
import { pageConfig, site } from '../config/website';

import path from 'path';

/** 渲染列表页 */
export function index(posts: PostData[], template: Template) {
  // ..
}

/** 渲染文章页 */
export function posts(input: PostData[], template: Template) {
  const posts = input.sort((pre, next) => {
    return pre.create > next.create ? -1 : 1;
  });

  for (const post of posts) {
    const createAt = (new Date(post.create)).getFullYear().toString();
    const decodeTitle = toPinyin(post.title).toLowerCase();

    if (!post.pathname) {
      post.pathname = path.join('posts', createAt, decodeTitle);
    }

    const tokens = Markdown.parse(post.content, {});
    const markdownContent = Markdown.renderer.render(tokens, Markdown.options, {});
    const htmlContent = template.DefaultPost({
      post: markdownContent,
      create: post.create,
      pageTitle: post.title,
      articleTitle: post.title,
      siteTitle: site.title,
      author: site.author,
      description: post.description,
      keywords: post.tags,
      styles: post.styles,
      scripts: post.scripts,
      pathname: post.pathname,
      publicPath,
    });

    post.html = htmlContent;
  }

  return posts;
}
