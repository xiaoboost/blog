import React from 'react';
import { readFile } from 'fs/promises';
import { forEach, defineUtils } from '@blog/context/runtime';
import { getCustomTextByPost, getFontFile, FontCacheData } from './utils';

const componentName = 'font-block';

export interface FontBlockProps {
  /** 自定义字体路径 */
  src: string;
  /**
   * 文字方向
   *   - `'horizontal'` - 从左往右
   *   - `'vertical'` - 从上往下
   *
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * 对齐方向
   *
   * @default 'left'
   */
  align?: 'left' | 'right' | 'center';
  /**
   * 是否使用首行缩进
   *
   * @default true
   */
  indent?: boolean;
}

/** 自定义字体块 */
export function FontBlock(props: FontBlockProps) {
  return <div></div>;
}

export const utils = defineUtils([]);

forEach((runtime) => {
  const fileCache = new Map<string, Buffer>();
  const fontCache = new Map<string, FontCacheData>();

  runtime.hooks.beforeEachPost.tapPromise(componentName, async (post) => {
    const fontData = getCustomTextByPost(post);

    // TODO: 调试状态时，不用做裁剪操作

    for (const data of fontData) {
      const fileContent = fileCache.has(data.src)
        ? fileCache.get(data.src)!
        : await readFile(data.src);

      if (!fileCache.has(data.src)) {
        fileCache.set(data.src, fileContent);
      }

      const key = `${data.src}:${data.text}`;

      if (fontCache.has(key)) {
        // ..
      } else {
        // ..
      }
    }
  });

  runtime.hooks.processAssets.tap(componentName, (assets) => {
    return assets.slice();
  });
});
