import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import type { Alignment, BoxProps, Length } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export interface GridProps extends BoxProps {
  columns?: number | string;
  rows?: number | string;
  gap?: Length;
  columnGap?: Length;
  rowGap?: Length;
  align?: Alignment;
  justify?: Alignment;
}

function tracks(value: number | string): string {
  return typeof value === 'string' ? value : `repeat(${value}, minmax(0, 1fr))`;
}

export function Grid({
  columns,
  rows,
  gap,
  columnGap,
  rowGap,
  align = 'stretch',
  justify = 'stretch',
  children,
  className,
  style,
  ...props
}: GridProps) {
  const { attributes, boxStyle } = extractBoxProps(props);

  return (
    <div
      {...attributes}
      className={stringifyClass(styles.classes.box, styles.classes.grid, className)}
      style={{
        gridTemplateColumns: columns === undefined ? undefined : tracks(columns),
        gridTemplateRows: rows === undefined ? undefined : tracks(rows),
        columnGap: columnGap ?? gap,
        rowGap: rowGap ?? gap,
        alignItems: align,
        justifyItems: justify,
        ...boxStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
