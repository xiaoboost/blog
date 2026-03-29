import React, { SVGProps } from 'react';
import { stringifyClass } from '@xiao-ai/utils';

import styles from './index.jss';

export interface IconProps extends SVGProps<SVGSVGElement> {
  viewBox: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
  children: React.ReactNode;
}

/** 图标组件对外 props（viewBox、children 由组件内部固定） */
export type IconComponentProps = Omit<IconProps, 'viewBox' | 'children'>;

export function IconBox({
  className,
  style,
  viewBox,
  fill = 'transparent',
  stroke = 'currentColor',
  strokeWidth = '1',
  children,
  ...restProps
}: IconProps) {
  return (
    <i className={stringifyClass(styles.classes.iconBox, className)} style={style}>
      <svg
        version='1.1'
        width='1em'
        height='1em'
        aria-hidden='true'
        viewBox={viewBox}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        {...restProps}
      >
        {children}
      </svg>
    </i>
  );
}
