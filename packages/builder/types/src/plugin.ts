import type { BuilderInstance, RunnerInstance } from './builder';

/** 构建器插件 */
export interface BuilderPlugin {
  name: string;
  apply(builder: BuilderInstance): void;
}

/** 运行器插件 */
export interface RunnerPlugin {
  name: string;
  apply(builder: RunnerInstance): void;
}
