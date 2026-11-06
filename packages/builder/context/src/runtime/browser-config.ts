import type { BrowserConfig } from '@blog/types';

export const BrowserConfigGlobalKey = '__BLOG_BROWSER_CONFIG__';
export const BrowserConfigReadyEvent = 'blog:browser-config-ready';

/** 配置合并 */
export function mergeBrowserConfig(...configs: BrowserConfig[]): BrowserConfig {
  const result: BrowserConfig = {};
  const lazyScripts = new Map<string, readonly string[]>();
  for (const config of configs) {
    Object.assign(result, config);
    for (const [name, paths] of Object.entries(config.lazyScripts ?? {})) {
      const previous = lazyScripts.get(name);

      if (previous && JSON.stringify(previous) !== JSON.stringify(paths)) {
        throw new Error(`按需脚本名称冲突：${name}`);
      }

      lazyScripts.set(name, [...paths]);
    }
  }
  delete result.lazyScripts;

  if (lazyScripts.size) {
    result.lazyScripts = Object.fromEntries(lazyScripts);
  }

  return result;
}
