/** 全局变量名称 */
export enum GlobalKey {
  JSS = '__Jss',
  Memory = '__Memory',
  Builder = '__Builder',
  ModuleLoader = '__ModuleLoader',
}

/** 缓存类型 */
export type Memory = Map<string, any>;
