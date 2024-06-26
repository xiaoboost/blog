import type { BuilderInstance } from '@blog/types';

/** 后缀匹配 */
export const EntrySuffix = /\.script\.(t|j)s/;
/** Script 构建器缓存 */
export const builderCache = new Map<string, BuilderInstance>();
