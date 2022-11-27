/** 卸载函数 */
export type UnActive = () => void;

/** 脚本模块 */
export interface ScriptModule {
  /** 当前模块地址 */
  currentScript: string;
  /**
   * 启动模块
   *  - 返回卸载模块函数
   */
  active(): UnActive;
  /** 是否重载整个脚本 */
  shouldReload?(): boolean;
}

/** 模块装载器 */
export interface ModuleLoader {
  /** 安装模块 */
  install(module: ScriptModule): void;
  /** 卸载模块 */
  uninstall(src?: string): void;
  /** 重载模块 */
  reload(): void;
}
