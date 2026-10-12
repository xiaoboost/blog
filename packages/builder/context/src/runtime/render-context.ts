import type { IRenderContext } from '@blog/types';
import { createContext, useContext, useRef } from 'react';

/** 渲染上下文 */
export const RenderContext = createContext<IRenderContext>(null!);

/** 读取当前渲染上下文 */
export function useRenderContext(): IRenderContext {
  return useContext(RenderContext);
}

/** 渲染中执行一次 */
export function useRenderOnce(cb: () => any): void {
  const result = useRef<boolean>(false);

  if (!result.current) {
    cb();
    result.current = true;
  }
}
