import { useRenderOnce } from '@blog/context/runtime';
import { useSlideStore } from '../slide/collect/context';
import type { AnimateProps } from './types';

/** 动画组件 */
export function Animate(props: AnimateProps) {
  const store = useSlideStore();

  useRenderOnce(() => {
    store.addAction(props);
  });

  return null;
}
