import type { IRenderContext } from '@blog/types';
import { createContext, useContext } from 'react';

/** 渲染上下文 */
export const RenderContext = createContext<IRenderContext>(null!);

/** 读取当前渲染上下文 */
export function useRenderContext(): IRenderContext {
  return useContext(RenderContext);
}
