import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import type { BoxProps } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export function Box({
  children,
  className,
  style,
  ...props
}: BoxProps) {
  const { attributes, boxStyle } = extractBoxProps(props);

  return (
    <div
      {...attributes}
      className={stringifyClass(styles.classes.box, className)}
      style={{ ...boxStyle, ...style }}
    >
      {children}
    </div>
  );
}
