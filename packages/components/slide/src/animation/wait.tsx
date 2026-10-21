import { useRenderOnce } from '@blog/context/runtime';
import { useSlideStore } from '../slide/collect/context';
import type { WaitProps } from './types';

/** 在编排中占用一段时间，不输出 DOM 或动作。 */
export function Wait(props: WaitProps) {
  const store = useSlideStore();

  useRenderOnce(() => {
    store.addWait(props);
  });

  return null;
}
