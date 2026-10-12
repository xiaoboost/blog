import type { CSSProperties, ReactNode } from 'react';

/** 作者组件只透传明确声明的属性；事件交给独立浏览器脚本。 */
export interface VisualProps {
  children?: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
  [attribute: `data-${string}`]: unknown;
  [attribute: `aria-${string}`]: string | number | boolean | undefined;
}

export type Length = number | string;
export type Spacing = Length | { horizontal?: Length; vertical?: Length };
export type FlexSize = 'content' | 'fill' | 'fixed' | number;

export interface BoxBorder {
  thickness?: Length;
  color?: string;
  pattern?: 'solid' | 'dashed' | 'dotted';
}

export interface BoxProps extends VisualProps {
  margin?: Spacing;
  padding?: Spacing;
  width?: Length;
  height?: Length;
  minWidth?: Length;
  maxWidth?: Length;
  minHeight?: Length;
  maxHeight?: Length;
  border?: BoxBorder;
  radius?: Length;
  background?: CSSProperties['background'];
  shadow?: CSSProperties['boxShadow'];
  overflow?: CSSProperties['overflow'];
  flex?: FlexSize;
}

export type Alignment = 'start' | 'center' | 'end' | 'stretch';
