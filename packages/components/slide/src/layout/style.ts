import { BorderPrimary } from '@blog/styles/common';
import type { CSSProperties } from 'react';
import type { BoxProps, FlexSize, Spacing } from '../types';

function spacing(value: Spacing | undefined, prefix: 'margin' | 'padding'): CSSProperties {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== 'object') {
    return { [prefix]: value };
  }

  const result: CSSProperties = {};

  if (value.horizontal !== undefined) {
    result[`${prefix}Left`] = value.horizontal;
    result[`${prefix}Right`] = value.horizontal;
  }

  if (value.vertical !== undefined) {
    result[`${prefix}Top`] = value.vertical;
    result[`${prefix}Bottom`] = value.vertical;
  }

  return result;
}

function flexSize(value: FlexSize = 'content'): CSSProperties {
  if (value === 'content') {
    return { flex: '0 1 auto' };
  }

  if (value === 'fixed') {
    return { flex: '0 0 auto' };
  }

  if (value === 'fill') {
    return { flex: '1 1 0px', minWidth: 0, minHeight: 0 };
  }

  return { flex: `${value} 1 0px`, minWidth: 0, minHeight: 0 };
}

/** 分离 Box 样式属性与 DOM 属性；最终 class 和 style 由组件合并。 */
export function extractBoxProps(props: Omit<BoxProps, 'children' | 'className' | 'style'>) {
  const {
    margin,
    padding,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    border,
    radius,
    background,
    shadow,
    overflow,
    flex,
    ...attributes
  } = props;

  const sizing = {
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
  };
  const explicit: CSSProperties = {};
  for (const [key, value] of Object.entries(sizing)) {
    if (value !== undefined) {
      Object.assign(explicit, { [key]: value });
    }
  }

  if (radius !== undefined) {
    explicit.borderRadius = radius;
  }

  if (background !== undefined) {
    explicit.background = background;
  }

  if (shadow !== undefined) {
    explicit.boxShadow = shadow;
  }

  if (overflow !== undefined) {
    explicit.overflow = overflow;
  }

  if (border !== undefined) {
    explicit.borderWidth = border.thickness ?? 1;
    explicit.borderColor = border.color ?? BorderPrimary;
    explicit.borderStyle = border.pattern ?? 'solid';
  }

  return {
    attributes,
    boxStyle: {
      ...flexSize(flex),
      ...spacing(margin, 'margin'),
      ...spacing(padding, 'padding'),
      ...explicit,
    } satisfies CSSProperties,
  };
}
