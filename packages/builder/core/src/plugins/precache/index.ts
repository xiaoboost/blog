import { join } from 'path';

import type { BuilderPlugin } from '@blog/types';
import { build } from 'esbuild';

import { getCoreRoot } from '../../utils/path';

/** 插件名称 */
const PLUGIN_NAME = 'precache';

/** 读取代码并转译 */
async function loadTemplate(name: string, define: Record<string, string> = {}) {
  const result = await build({
    entryPoints: [join(getCoreRoot(), 'src/plugins/precache', name)],
    // 注册脚本与 SW 共用策略和资源识别模块，构建时各自打成独立的浏览器脚本。
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    target: 'es2022',
    minify: true,
    define,
  });
  return result.outputFiles[0].text;
}

/** 预缓存插件 */
export const Precache = (): BuilderPlugin => ({
  name: PLUGIN_NAME,
  apply(builder) {
    // 开发环境由现有热更新流程管理资源，只有生产构建启用页面缓存。
    if (builder.options.mode !== 'production') {
      return;
    }

    /** 缓存服务文件输出路径 */
    const SW_FILE_PATH = '/precache.js';

    // 注入全局注册脚本
    builder.hooks.runner.tap(PLUGIN_NAME, (runner) => {
      runner.registerHook(({ hooks }) => {
        hooks.afterReady.tapPromise(`${PLUGIN_NAME}:register`, async ({ site, rename }) => {
          const code = await loadTemplate('register.ts', {
            __SW_PATH__: JSON.stringify(SW_FILE_PATH),
          });
          const asset = {
            path: 'scripts/register-sw.js',
            content: Buffer.from(code),
          };

          const hashedPath = rename(asset);
          site.addAsset({ path: hashedPath, content: Buffer.from(code) });
          site.addScript({ src: hashedPath });
        });
      });
    });

    // 生成 sw 脚本
    builder.hooks.processAssets.tapPromise(PLUGIN_NAME, async (assets) => {
      // 内容更新由访问页面触发，不把构建时间或全站资源清单写入 SW。
      // 仅发布文章或样式时不必改变 SW 程序，页面仍会在访问时检查最新内容。
      const swCode = await loadTemplate('sw.ts');

      return [
        ...assets,
        {
          path: SW_FILE_PATH,
          content: Buffer.from(swCode),
        },
      ];
    });
  },
});
