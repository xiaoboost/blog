import React, { type ComponentPropsWithoutRef } from 'react';

export interface ChartProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'width' | 'height'> {
  /** 绘图宽度 */
  width: number;
  /** 绘图高度 */
  height: number;
}

/** 图表画布 */
export function Chart({
  width,
  height,
  children,
  style,
  ...props
}: ChartProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      {...props}
      style={{ maxWidth: '100%', height: 'auto', ...style }}
    >
      {children}
    </svg>
  );
}
