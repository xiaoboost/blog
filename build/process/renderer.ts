import type { PostData } from '../plugins/loader-md';
import type { Template } from './template';

import { Markdown } from '../markdown';
import { toPinyin, slice } from '../utils';

import { publicPath, outputDir } from '../config/project';
import { pageConfig, site } from '../config/website';

import type { FileData } from '../process/files';
import type { ExternalFile } from '../process/post';

import path from 'path';

/** 渲染列表页 */
export function index(
  input: PostData[],
  ext: ExternalFile,
  template: Template,
): FileData[] {
  const posts = input.filter((post) => post.public);
  const pagePosts = slice(posts, pageConfig.index);
  const getPathname = (index: number) => {
    if (index < 0) {
      return null;
    }

    if (index > pagePosts.length - 1) {
      return null;
    }

    return index === 0
      ? 'index.html'
      : path.normalize(`index/${index}/index.html`);
  };

  return pagePosts.map((page, index) => {
    const pathname = getPathname(index)!;
    const pageTitle = index === 0 ? site.title : `${site.title} | 第 ${index + 1} 页`;

    return {
      path: path.join(outputDir, pathname!),
      contents: template.Index({
        ...ext,
        posts: page,
        pageTitle,
        pathname,
        publicPath,
        plugins: ['goto-top'],
        siteTitle: site.title,
        next: getPathname(index + 1),
        pre: getPathname(index - 1),
      }),
    };
  });
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
      plugins: post.plugins,
      publicPath,
    });

    post.html = htmlContent;
  }

  return posts;
}
