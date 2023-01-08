import { remove } from '@xiao-ai/utils';
import { GlobalKey } from '@blog/context';
import type { ScriptModule, ModuleLoader } from '@blog/types';

interface ModuleData extends ScriptModule {
  /** 卸载函数 */
  unActive(): void;
}

class Module implements ModuleLoader {
  private _modules: ModuleData[] = [];

  /** 安装模块 */
  install(mod: ScriptModule) {
    this._modules.push({
      ...mod,
      unActive: mod.active(),
    });
  }

  /** 卸载模块 */
  uninstall(src?: string) {
    const modules = src
      ? this._modules.filter((mod) => mod.currentScript === src)
      : this._modules.slice();

    modules.forEach((mod) => {
      mod.unActive();
      remove(this._modules, mod);
    });
  }

  /** 重载模块 */
  reload() {
    this._modules.forEach((mod) => {
      mod.unActive();
      mod.unActive = mod.active();
    });
  }
}

export const module = new Module();

window[GlobalKey.ModuleLoader] = module;
