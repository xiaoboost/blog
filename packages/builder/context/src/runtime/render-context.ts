import { dirname, resolve } from 'path';
import { normalize, readImageMetadata } from '@blog/node';
import type {
  AssetData,
  ImageResource,
  IRenderContext,
  PostBasicData,
} from '@blog/types';
import { createContext, useContext, useRef } from 'react';
import { readAssetCached } from './asset';
import { Builder } from './builder';

/** 渲染上下文 */
export const RenderContext = createContext<IRenderContext>(null!);

/** 读取当前渲染上下文 */
export function useRenderContext(): IRenderContext {
  return useContext(RenderContext);
}

function addPageAsset(
  { page, isPreBuild }: IRenderContext,
  absolutePath: string | undefined,
): AssetData | undefined {
  if (isPreBuild || !absolutePath) {
    return;
  }

  const content = readAssetCached(absolutePath);
  const renamed = Builder.renameAsset({ path: absolutePath, content });

  if (!renamed) {
    throw new Error(`无法生成资源的发布路径：${absolutePath}`);
  }

  const asset = { path: normalize(page.pathname, renamed), content };
  page.addAsset(asset);
  return asset;
}

/** 将绝对路径对应的本地资源登记到当前页面，预构建阶段跳过。 */
export function usePageAsset(absolutePath: string | undefined): AssetData | undefined {
  return addPageAsset(useRenderContext(), absolutePath);
}

/** 显式封面优先，否则读取文章配置；未配置时由 Layout 使用默认图。 */
export function usePostCoverImage(
  post: PostBasicData,
  coverImage?: ImageResource,
): ImageResource | undefined {
  const context = useRenderContext();

  try {
    const sourcePath = !coverImage && !context.isPreBuild && post.coverImage
      ? resolve(dirname(post.filePath), decodeURIComponent(post.coverImage))
      : undefined;
    const asset = addPageAsset(context, sourcePath);

    return coverImage ?? (asset
      ? { src: asset.path, ...readImageMetadata(asset.content) }
      : undefined);
  }
  catch (error) {
    throw new Error(`文章封面图处理失败：${post.filePath}（coverImage: ${post.coverImage}）：${String(error)}`);
  }
}

/** 渲染中执行一次 */
export function useRenderOnce(cb: () => any): void {
  const result = useRef<boolean>(false);

  if (!result.current) {
    cb();
    result.current = true;
  }
}
