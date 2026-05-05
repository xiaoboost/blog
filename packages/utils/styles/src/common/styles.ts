import type { Styles } from '@blog/context/runtime';

export function createScrollbarWidth(width: number, prefix = ''): Styles {
  return {
    [`${prefix}::-webkit-scrollbar`]: {
      width,
      height: width,
    },
    [`${prefix}::-webkit-scrollbar-track`]: {
      boxShadow: `inset 0 0 ${width / 2}px rgba(0, 0, 0, .3)`,
    },
    [`${prefix}::-webkit-scrollbar-thumb`]: {
      boxShadow: `inset 0 0 ${width / 2}px rgba(0, 0, 0, .3)`,
    },
  };
}

/** 迭代标题元素 */
export function createHeadStyles(pre = '', cb: (level: number) => Styles) {
  const styles: Styles = {};

  for (let i = 1; i < 6; i++) {
    styles[`${pre}h${i}`] = cb(i);
  }

  return styles;
}
