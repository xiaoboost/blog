import { readFile } from 'fs/promises';
import {
  basename,
  dirname,
  extname,
  resolve,
} from 'path';
import {
  Builder,
  getAccessor,
  onBuild,
  useRenderContext,
} from '@blog/context/runtime';
import {
  normalize,
  convertImage,
  type ConvertImageOptions,
  type ConvertedImage,
} from '@blog/node';
import type { AssetData, BuildContext } from '@blog/types';

interface CachedImage {
  source: Buffer;
  image: ConvertedImage;
  path: string;
}

/** 分享图规格 */
export const ogImageMetadata = {
  width: 1200,
  height: 630,
  mimeType: 'image/jpeg',
} as const;

/** 图片转换配置 */
const imageOptions: ConvertImageOptions = {
  format: 'jpeg',
  background: '#ffffff',
  resize: {
    width: ogImageMetadata.width,
    height: ogImageMetadata.height,
    fit: 'cover',
    position: 'centre',
  },
};

const maxImageBytes = 300 * 1024;
const qualities = [80, 70, 60];
const defaultImagePath = normalize(resolve(__dirname, '../../assets/images/og-default.png'));
/** 转换映射缓存 */
const images = getAccessor('layout:og-image:images', () => new Map<string, CachedImage>()).get();

async function createOgImage(source: Uint8Array) {
  for (const quality of qualities) {
    const image = await convertImage(source, { ...imageOptions, quality });

    if (image.content.length <= maxImageBytes) {
      return image;
    }
  }

  throw new Error(`OG 图片压缩后仍超过 ${maxImageBytes / 1024} KB`);
}

function createOgAsset(
  sourcePath: string,
  image: ConvertedImage,
  rename: BuildContext['rename'],
): AssetData {
  const name = basename(sourcePath, extname(sourcePath));
  const asset = { path: `${name}.og.${image.extension}`, content: image.content };
  const path = rename(asset);
  return { ...asset, path };
}

onBuild(({ hooks }) => {
  hooks.beforeBuild.tapPromise('layout:og-images', async ({ site, pages, rename }) => {
    for (const page of pages) {
      const post = page.type === 'post' ? page.data.post.data : undefined;
      const sourcePath = post?.coverImage
        ? normalize(resolve(dirname(post.filePath), post.coverImage))
        : defaultImagePath;

      try {
        Builder.addWatchFiles(sourcePath);

        const cached = images.get(sourcePath);
        const source = cached?.source ?? await readFile(sourcePath);
        const image = cached?.image ?? await createOgImage(source);
        const { content, path } = createOgAsset(sourcePath, image, rename);

        images.set(sourcePath, {
          source,
          image,
          path,
        });

        if (sourcePath === defaultImagePath) {
          site.addAsset({ content, path: normalize('/', path) });
        }
        else {
          page.addAsset({ content, path: normalize(page.pathname, path) });
        }
      }
      catch (error) {
        images.delete(sourcePath);
        throw new Error(`OG 图片转换失败：${sourcePath}（页面：${page.pathname}）：${String(error)}`);
      }
    }
  });
});

/** 读取对应 OG 分享图地址 */
export function useOgImage(sourcePath?: string): string | undefined {
  const { page, isPreBuild } = useRenderContext();

  if (isPreBuild) {
    return;
  }

  const path = sourcePath === undefined ? defaultImagePath : normalize(sourcePath);
  const image = images.get(path);

  if (!image) {
    throw new Error(`OG 图片尚未生成：${sourcePath ?? '默认图'}（页面：${page.pathname}）`);
  }

  return normalize(path === defaultImagePath ? '/' : page.pathname, image.path);
}
