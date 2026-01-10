import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';
import { defineUtils } from '@blog/context/runtime';

import styles from './index.jss';
import assets from './index.script';

export interface TextGlossProps {
  className?: string;
  styles?: React.CSSProperties;
  /** 主体文本 */
  children: React.ReactNode;
  /** 点击后展开的详细文本 */
  description: React.ReactNode;
  /** 右侧是否要显示分割线 */
  showSeparator?: boolean;
}

export function TextGloss({
  children,
  className: cln,
  styles: customStyles,
  description,
  showSeparator = true,
}: TextGlossProps) {
  const { classes } = styles;
  return (
    <span
      className={stringifyClass(classes.glossWrapper, cln, {
        [classes.glossSeparator]: showSeparator,
      })}
      style={customStyles}
    >
      <span className={stringifyClass(classes.glossContent, cln)}>{children}</span>
      <span className={stringifyClass(classes.glossDescription, cln)}>{description}</span>
    </span>
  );
}

export const utils = defineUtils(assets);
