import type { ImageMetadata } from '@blog/types';
import { imageMeta } from 'image-meta';

/** 只读取图片内容，不读取文件或注册资源。 */
export function readImageMetadata(content: Uint8Array): ImageMetadata {
  const { width, height, type } = imageMeta(content);

  if (!width || !height || !type) {
    throw new TypeError('无法读取图片的类型或尺寸');
  }

  const mimeType = type === 'jpg'
    ? 'image/jpeg'
    : type === 'svg' ? 'image/svg+xml' : `image/${type}`;

  return { width, height, mimeType };
}
