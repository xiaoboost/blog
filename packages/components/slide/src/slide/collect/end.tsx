import { useRenderOnce } from '@blog/context/runtime';
import { useSlideStore } from './context';
import type { ScopeKind } from './scope';

export interface ScopeEndProps {
  scope: ScopeKind;
}

/**
 * 结束当前作用域堆栈
 */
export function ScopeEnd({ scope }: ScopeEndProps) {
  const store = useSlideStore();

  useRenderOnce(() => {
    store.end(scope);
  });

  return null;
}
