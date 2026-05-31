import { onBuild, defineUtils } from '@blog/context/runtime';
import type { PageDataMap } from '@blog/types';
import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import script from './font-block.script';
import styles from './index.jss';
import {
  getCustomTextByPost,
  getFontContentBySrc,
  getFontClass,
  setFontClass,
} from './utils';

const componentName = 'font-block';

export interface FontBlockProps {
  /**
   * 自定义字体路径
   *
   * @description 绝对路径
   * @description 以文章文件路径为主的相对路径
   * @description 以 posts 路径为的主的缺省路径
   */
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
   * @default 24
   */
  fontSize: number;
  /**
   * 段落间距
   *
   * @default 0
   */
  paragraphGutter: number;
  /**
   * 行高
   *
   * @default undefined
   */
  lineHeight?: number;
  /**
   * 外边距
   *
   * @default undefined
   */
  margin?: string;
  /**
   * 是否使用首行缩进
   *
   * @description 单位`em`
   * @default 1
   */
  indent?: string | false;
  /** 输入文本 */
  children: string;
}

/** 自定义字体块 */
export function FontBlock(props: FontBlockProps) {
  const { children } = (props.children as any).props;
  const className = getFontClass(props.src);

  if (!className) {
    throw new Error(`未发现自定义字体实例：${JSON.stringify(props)}`);
  }

  const {
    direction = 'horizontal',
    align = 'left',
    indent = 1,
    fontSize = 24,
    paragraphGutter = 0,
    lineHeight,
    margin,
  } = props;
  const lines: string[] = children.replace(/\r/g, '').split('\n');

  return (
    <div
      className={stringifyClass(
        styles.classes.fontBlock,
        className,
        direction === 'horizontal'
          ? styles.classes.fontBlockHorizontal
          : direction === 'vertical'
            ? styles.classes.fontBlockVertical
            : styles.classes.fontBlockVerticalRight,
        indent ? '' : styles.classes.fontBlockNoIndent,
      )}
      style={{
        textAlign: align,
        fontSize,
        margin,
      }}
    >
      {lines.map((line, i, arr) => (
        <p
          key={i}
          style={{
            lineHeight,
            marginBottom: paragraphGutter > 0 ? (i === arr.length - 1 ? 0 : paragraphGutter) : 0,
            textIndent: indent ? `${indent}em` : undefined,
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

export const utils = defineUtils(script);

onBuild((runtime) => {
  runtime.hooks.beforeBuild.tapPromise(componentName, async ({ pages, rename }) => {
    for (const page of pages) {
      if (page.type !== 'post') continue;

      const d = page.data as PageDataMap['post'];
      const post = d.post;
      const fontDataList = getCustomTextByPost(post);

      if (fontDataList.length === 0) continue;

      const families: string[] = [];

      for (const data of fontDataList) {
        const content = await getFontContentBySrc(data.src);
        const family = `font-block:${data.src}`;
        const bucket = page.ensureFontBucket(family, content);

        bucket.addText(...data.text);
        setFontClass(data.originSrc, bucket.getClassName());
        setFontClass(data.src, bucket.getClassName());
        families.push(family);
      }

      await page.buildFonts({
        families,
        cssPath: `${page.pathname}/fonts/font-block.css`,
        rename,
      });
    }
  });
});
