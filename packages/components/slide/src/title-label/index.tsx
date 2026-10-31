import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import type { Length, VisualProps } from '../types';
import styles from './index.jss';

export interface TitleLabelProps extends VisualProps {
  /** 与下方标题或内容的间距，默认 20px。 */
  marginBottom?: Length;
}

/** 大标题上方的短标签，不占用标题层级。 */
export function TitleLabel({
  children,
  className,
  style,
  marginBottom = 20,
  ...attributes
}: TitleLabelProps) {
  return (
    <p
      {...attributes}
      className={stringifyClass(styles.classes.titleLabel, className)}
      style={{ margin: 0, marginBottom, ...style }}
    >
      {children}
    </p>
  );
}
