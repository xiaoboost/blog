import React from 'react';
import { forEach, defineUtils, Builder } from '@blog/context/runtime';
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
   *   - `'horizontal'` - 横向，从上往下
   *   - `'vertical'` - 竖向，从左往右
   *   - `'verticalRight'` - 竖向，从右往左
   *
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical' | 'verticalRight';
  /**
   * 对齐方向
   *
   * @default 'left'
   */
  align?: 'left' | 'right' | 'center';
  /**
   * 文字大小
   *
   * @default 20
   */
  fontSize: number;
  /**
   * 段落间距
   *
   * @default 0
   */
  paragraphGutter: number;
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
  const { children } = (props.children as any).props;
  const font = getCustomFontByProps({
    ...props,
    children,
  });

  if (!font) {
    throw new Error(`未发现自定义字体实例：${JSON.stringify(props)}`);
  }

  const {
    direction = 'horizontal',
    align = 'left',
    indent = '2em',
    fontSize = 20,
    paragraphGutter = 0,
  } = props;
  const lines: string[] = children.replace(/\r/g, '').split('\n');

  return (
    <div
      className={stringifyClass(
        styles.classes.fontBlock,
        font.className,
        direction === 'horizontal'
          ? styles.classes.fontBlockHorizontal
          : direction === 'vertical'
          ? styles.classes.fontBlockVertical
          : styles.classes.fontBlockVerticalRight,
        indent ? '' : styles.classes.fontBlockNoIndent,
      )}
      style={{
        textIndent: isString(indent) ? indent : undefined,
        textAlign: align,
        fontSize,
      }}
    >
      {lines.map((line, i, arr) => (
        <p
          key={i}
          style={{
            marginBottom: paragraphGutter > 0 ? (i === arr.length - 1 ? 0 : paragraphGutter) : 0,
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

export const utils = defineUtils(script);

forEach((runtime) => {
  runtime.hooks.beforeEachPost.tapPromise(componentName, async (post) => {
    for (const data of getCustomTextByPost(post)) {
      const font = getCustomFontByData(data);
      const fontAssets = await font.getAssets();
      const cssFile = fontAssets.find((item) => item.path.endsWith('.css'));

      if (cssFile) {
        post.utils.addAssetNames(cssFile.path);
      }

      Builder.emitAsset(...fontAssets);
    }
  });
});
