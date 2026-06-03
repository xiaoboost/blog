import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import styles from './index.jss';

export interface SubtitleProps {
  /** 副标题内容 */
  children: React.ReactNode;
  /**
   * 是否显示前置装饰线
   *
   * @default true
   */
  showDash?: boolean;
}

/**
 * 副标题
 *
 * @description 独立成行的块级元素，用于标题下方的出处、说明等辅助信息。
 */
export function Subtitle({ children, showDash = true }: SubtitleProps) {
  const { classes } = styles;

  return (
    <p
      className={stringifyClass(classes.subtitle, {
        [classes.noDash]: !showDash,
      })}
    >
      {children}
    </p>
  );
}
