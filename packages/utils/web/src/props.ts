import { isUndef } from '@xiao-ai/utils';

export function getDataFromEl<T = string>(el: HTMLElement, key: string): T | null {
  const val = el.getAttribute(`data-${key}`);

  if (isUndef(val)) {
    return val;
  }

  if (val.length === 0) {
    return true as any;
  }

  return val as any;
}
