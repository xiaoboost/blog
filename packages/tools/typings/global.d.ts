declare function setGlobalVar(key: string, val: any): void;
declare function getGlobalVar<T = any>(key: string): T | undefined;

type unActive = () => void;

interface ScriptModule {
  /** 当前模块地址 */
  currentScript: string;
  /**
   * 启动模块
   *  - 返回卸载模块函数
   */
  active(): unActive;
  /** 是否重载整个脚本 */
  shouldReload?(): boolean;
}

interface ModuleLoader {
  /** 安装模块 */
  install(module: ScriptModule): void;
  /** 卸载模块 */
  uninstall(src?: string): void;
  /** 重载模块 */
  reload(): void;
}

interface Window {
  Module: ModuleLoader;
}
