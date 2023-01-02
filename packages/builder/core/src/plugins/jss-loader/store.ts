import type { BuilderInstance } from '@blog/types';

/** CSS 代码缓存 */
export const cssCodeCache = new Map<string, string>();
/** JSS 构建器缓存 */
export const builderCache = new Map<string, BuilderInstance>();
