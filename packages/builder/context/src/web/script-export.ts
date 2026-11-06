/** 脚本导出值命名空间 */
export const ScriptExportsKey = '__BLOG_SCRIPT_EXPORTS__';

type ScriptWithExports = HTMLScriptElement & { [ScriptExportsKey]?: unknown };

/** 设置脚本导出值 */
export function setScriptExports<T>(value: T): void {
  const script = document.currentScript as ScriptWithExports | null;

  if (!script) {
    throw new Error('setScriptExports 必须在脚本同步执行期间调用。');
  }

  script[ScriptExportsKey] = value;
}

/** 读取脚本导出值 */
export function getScriptExports<T = unknown>(script: HTMLScriptElement): T {
  return (script as ScriptWithExports)[ScriptExportsKey] as T;
}
