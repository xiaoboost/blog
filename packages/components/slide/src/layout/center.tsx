import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import type { BoxProps } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export interface CenterProps extends BoxProps {
  horizontal?: boolean;
  vertical?: boolean;
}

export function Center({
  horizontal = true,
  vertical = true,
  children,
  className,
  style,
  ...props
}: CenterProps) {
  const { attributes, boxStyle } = extractBoxProps(props);

  return (
    <div
      {...attributes}
      className={stringifyClass(styles.classes.box, styles.classes.center, className)}
      style={{
        justifyContent: horizontal ? 'center' : 'flex-start',
        alignItems: vertical ? 'center' : 'flex-start',
        ...boxStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
