/** 全局变量名称 */
export enum GlobalKey {
  Memory = '__Memory',
  Builder = '__Builder',
  ModuleLoader = '__ModuleLoader',
  RuntimeCallbacks = '__RuntimeCallbacks',
}

/** 缓存类型 */
export type Memory = Map<string, any>;
