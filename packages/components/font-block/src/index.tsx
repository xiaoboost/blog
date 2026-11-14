import { defineUtils } from '@blog/context/runtime';
import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import { useFontBlock } from './font';
import script from './font-block.script';
import styles from './index.jss';
import { getFontText } from './utils';

export interface FontBlockProps {
  /**
   * 自定义字体路径
   *
   * @description 支持绝对路径和 @blog 包内路径
   * @description 传 baseDir 时，相对路径以 baseDir 为准
   * @description 省略 baseDir 时，./ 相对文章路径，其他路径相对 posts 根目录
   */
  src: string;
  /** 相对字体路径的基准目录；传 __dirname，省略时沿用文章的旧路径规则。 */
  baseDir?: string;
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
  fontSize?: number;
  /**
   * 段落间距
   *
   * @default 0
   */
  paragraphGutter?: number;
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
  children: React.ReactNode;
}

/** 自定义字体块 */
export function FontBlock(props: FontBlockProps) {
  const children = getFontText(props.children);
  const className = useFontBlock({ src: props.src, baseDir: props.baseDir, text: children });

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
