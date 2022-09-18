import type { BuilderInstance } from './builder';

/** 构建器插件 */
export interface BuilderPlugin {
  name: string;
  apply(builder: BuilderInstance): void;
}
