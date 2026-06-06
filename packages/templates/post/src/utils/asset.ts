import { readFileSync } from 'fs';
import path from 'path';
import { getAccessor, useRenderContext, Builder } from '@blog/context/runtime';
import { normalize } from '@blog/node';
import { isUrl } from '@blog/shared';
import type { PageDataMap } from '@blog/types';
import { useRef } from 'react';
/**
 * 将本地文件注册为页面专属资源，返回最终渲染路径
 *
 * @param src 相对于文章所在目录的文件路径，如 './photo.jpg'
 * @returns 资源最终输出路径，预构建阶段返回 null
 */
export function usePageAsset(src: string): string | null {
  const { page, isPreBuild } = useRenderContext();

  if (isPreBuild || isUrl(src)) return null;

  const assetRef = useRef<{ path: string; content: Buffer } | null>(null);
  const addedRef = useRef(false);

  if (!assetRef.current) {
    const { post } = page.data as PageDataMap['post'];
    const postDir = path.dirname(post.data.filePath);
    const absPath = path.join(postDir, src);
    const cacheKey = `page-asset:${absPath}`;

    const accessor = getAccessor(cacheKey, () => readFileSync(absPath));
    const content: Buffer = accessor.get() ?? readFileSync(absPath);

    const renamed = Builder.renameAsset({ path: absPath, content });
    const finalPath = renamed
      ? normalize(page.pathname, renamed)
      : absPath;

    assetRef.current = { path: finalPath, content };
  }

  if (!addedRef.current) {
    addedRef.current = true;
    page.addAsset(assetRef.current);
  }

  return assetRef.current.path;
}
