import React from 'react';
import { AssetData } from '@blog/types';
import { forEach, defineUtils } from '@blog/context/runtime';
import { stringifyClass, isString } from '@xiao-ai/utils';
import { getCustomTextByPost, getCustomFontByData, getCustomFontByProps } from './utils';

import styles from './index.jss';
import script from './font-block.script';

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
   * @default `2em`
   */
  indent?: string | false;
  /** 输入文本 */
  children: string;
}

/** 自定义字体块 */
export function FontBlock(props: FontBlockProps) {
  const font = getCustomFontByProps(props);

  if (!font) {
    throw new Error(`未发现自定义字体实例：${JSON.stringify(props)}`);
  }

  const { direction = 'horizontal', align = 'left', indent = '2em', children } = props;
  const lines = children.replace(/\r/g, '').split('\n');

  return (
    <div
      className={stringifyClass(
        styles.classes.fontBlock,
        font.className,
        direction === 'horizontal'
          ? styles.classes.fontBlockHorizontal
          : styles.classes.fontBlockVertical,
        align === 'left'
          ? styles.classes.fontBlockLeft
          : align === 'right'
          ? styles.classes.fontBlockRight
          : styles.classes.fontBlockCenter,
        indent ? '' : styles.classes.fontBlockNoIndent,
      )}
      style={{
        textIndent: isString(indent) ? indent : undefined,
      }}
    >
      {lines.map((line) => (
        <p>{line}</p>
      ))}
    </div>
  );
}

export const utils = defineUtils(script);

forEach((runtime) => {
  const postAssets: AssetData[] = [];

  runtime.hooks.beforeEachPost.tapPromise(componentName, async (post) => {
    for (const data of getCustomTextByPost(post)) {
      const font = getCustomFontByData(data);
      const fontAssets = await font.getAssets();
      const cssFile = fontAssets.find((item) => item.path.endsWith('.css'));

      if (cssFile) {
        post.utils.addAssetNames(cssFile.path);
      }

      postAssets.push(...fontAssets);
    }
  });

  runtime.hooks.processAssets.tap(componentName, (assets) => {
    return assets.concat(postAssets);
  });
});
