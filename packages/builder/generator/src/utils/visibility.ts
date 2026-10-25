import type { PostExportData } from '@blog/types';

/**
 * 是否渲染文章
 *
 * @description 生产模式下，草稿文章不渲染
 */
export function shouldRenderPost(post: PostExportData) {
  return process.env.NODE_ENV !== 'production' || !post.data.draft;
}

/**
 * 是否显示在列表中
 *
 * @description 文章要渲染，但是在列表中不显示
 */
export function isListedPost(post: PostExportData) {
  return shouldRenderPost(post) && post.data.public;
}
