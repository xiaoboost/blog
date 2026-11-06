import { GlobalKey } from '@blog/context/web';
import type { ScriptModule, ModuleLoader } from '@blog/types';
import { remove } from '@xiao-ai/utils';

interface ModuleData extends ScriptModule {
  /** 卸载函数 */
  unActive(): void;
}

class Module implements ModuleLoader {
  private _modules: ModuleData[] = [];
  private _updating = false;

  /** 安装模块 */
  install(mod: ScriptModule) {
    this._modules.push({
      ...mod,
      unActive: this._updating ? () => {} : mod.active(),
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
    this.update(() => {});
  }

  /** DOM 和脚本更新完成后再启动模块，避免新代码读取旧 DOM。 */
  update(apply: () => void) {
    this._modules.forEach((mod) => {
      mod.unActive();
      mod.unActive = () => {};
    });
    this._updating = true;
    try {
      apply();
    }
    finally {
      this._updating = false;
      this._modules.forEach((mod) => {
        mod.unActive = mod.active();
      });
    }
  }
}

export const module = new Module();

(window as any)[GlobalKey.ModuleLoader] = module;
