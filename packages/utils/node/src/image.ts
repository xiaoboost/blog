import type { ImageMetadata } from '@blog/types';
import { imageMeta } from 'image-meta';
import sharp, { type Colour, type ResizeOptions } from 'sharp';

export interface ConvertImageOptions {
  format: 'jpeg' | 'png' | 'webp';
  resize?: ResizeOptions;
  quality?: number;
  background?: Colour;
}

export interface ConvertedImage extends ImageMetadata {
  content: Buffer;
  extension: string;
}

/** 转换图片 */
export async function convertImage(
  content: Uint8Array,
  options: ConvertImageOptions,
): Promise<ConvertedImage> {
  let pipeline = sharp(content).autoOrient();

  if (options.background !== undefined) {
    pipeline = pipeline.flatten({ background: options.background });
  }

  if (options.resize) {
    pipeline = pipeline.resize(options.resize);
  }

  const output = await pipeline
    .toFormat(options.format, { quality: options.quality })
    .toBuffer();

  return {
    content: output,
    ...readImageMetadata(output),
    extension: options.format === 'jpeg' ? 'jpg' : options.format,
  };
}

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
