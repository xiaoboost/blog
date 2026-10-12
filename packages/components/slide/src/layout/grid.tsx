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

function tracks(value: number | string, name: string): string {
  if (typeof value === 'string') {
    if (!value.trim()) {
      throw new Error(`[mdx-slide] Grid.${name} 不能为空。`);
    }

    return value;
  }

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`[mdx-slide] Grid.${name} 必须是正整数或 CSS 轨道字符串。`);
  }

  return `repeat(${value}, minmax(0, 1fr))`;
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
        gridTemplateColumns: columns === undefined ? undefined : tracks(columns, 'columns'),
        gridTemplateRows: rows === undefined ? undefined : tracks(rows, 'rows'),
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
