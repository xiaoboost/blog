import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import type { Alignment, BoxProps, Length } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export interface FlexProps extends BoxProps {
  direction?: 'row' | 'column';
  gap?: Length;
  align?: Alignment;
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
}

export function Flex({
  direction,
  gap,
  align,
  justify,
  wrap,
  children,
  className,
  style,
  ...props
}: FlexProps) {
  const { attributes, boxStyle } = extractBoxProps(props);

  return (
    <div
      {...attributes}
      className={stringifyClass(styles.classes.box, styles.classes.flex, className)}
      style={{
        flexDirection: direction,
        gap,
        alignItems: align === 'start' || align === 'end' ? `flex-${align}` : align,
        justifyContent: justify === 'start' || justify === 'end' ? `flex-${justify}` : justify,
        flexWrap: wrap === undefined ? undefined : wrap ? 'wrap' : 'nowrap',
        ...boxStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
