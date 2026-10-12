import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import type { BoxProps, Length } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export interface PlaceProps extends BoxProps {
  x?: Length;
  y?: Length;
  zIndex?: number;
}

export function Place({
  x,
  y,
  zIndex,
  children,
  className,
  style,
  ...props
}: PlaceProps) {
  const { attributes, boxStyle } = extractBoxProps(props);

  return (
    <div
      {...attributes}
      className={stringifyClass(styles.classes.box, styles.classes.place, className)}
      style={{
        left: x,
        top: y,
        zIndex,
        ...boxStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
