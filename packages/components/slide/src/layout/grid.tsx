import { stringifyClass } from '@xiao-ai/utils';
import type { Alignment, BoxProps, Length } from '../types';
import styles from './index.jss';
import { extractBoxProps } from './style';

export interface GridProps extends BoxProps {
  /** 默认两列；数字表示等宽列数，字符串可指定各列宽度。 */
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
  align,
  justify,
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
