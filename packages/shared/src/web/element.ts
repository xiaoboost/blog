export type ScrollMode = 'all' | 'x' | 'y';

export function getStyle(el: HTMLElement, name: string): string {
  if (name === 'float') {
    name = 'cssFloat';
  }

  try {
    const style = el.style[name];

    if (style) {
      return style;
    }

    const computed = document.defaultView?.getComputedStyle(el);
    return computed ? computed[name] : '';
  } catch (e) {
    return el.style[name];
  }
}

export function isScroll(el: HTMLElement, mode: ScrollMode) {
  const overflow =
    mode === 'all'
      ? getStyle(el, 'overflow')
      : mode === 'x'
      ? getStyle(el, 'overflow-x')
      : getStyle(el, 'overflow-y');

  return overflow.match(/(scroll|auto)/);
}

export function getScrollContainer(el: HTMLElement, mode: ScrollMode): Window | HTMLElement {
  let parent = el;

  while (parent) {
    if ([window, document, document.documentElement].includes(parent)) {
      return window;
    }

    if (isScroll(parent, mode)) {
      return parent;
    }

    parent = parent.parentElement as any;
  }

  return parent;
}
