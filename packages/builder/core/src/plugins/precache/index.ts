import { readFileSync } from 'fs';
import type { BuilderPlugin } from '@blog/types';
import { transform } from 'esbuild';

/** 插件名称 */
const PLUGIN_NAME = 'precache';
/** 页面刷新事件 */
const CONTENT_UPDATED = 'content-updated';

/** 读取代码并转译 */
async function loadTemplate(name: string, define: Record<string, string>) {
  const source = readFileSync(require.resolve(`@blog/core/src/plugins/precache/${name}`), 'utf-8');
  const result = await transform(source, {
    loader: 'ts',
    minify: true,
    define,
  });
  return result.code;
}

/** 需要预缓存的静态资源扩展名 */
const PRECACHE_EXTENSIONS = [
  '.js', '.css', '.woff2', '.ico', '.svg',
];

/**
 * 运行时缓存
 *
 * @description 首次访问后才缓存
 */
const RUNTIME_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
];

/** 生成 SW 模板用的正则模式字符串 */
function buildExtPattern(extensions: string[]): string {
  const names = extensions.map((ext) => ext.slice(1));
  return `\\.(?:${names.join('|')})$`;
}

/** 预缓存插件 */
export const Precache = (): BuilderPlugin => ({
  name: PLUGIN_NAME,
  apply(builder) {
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
            __CONTENT_UPDATED__: JSON.stringify(CONTENT_UPDATED),
          });
          const asset = {
            path: 'scripts/register-sw.js',
            content: Buffer.from(code),
          };

          const hashedPath = rename(asset);
          site.addAsset({ path: hashedPath, content: Buffer.from(code) });
          site.addScript(hashedPath);
        });
      });
    });

    // 生成 sw 脚本
    builder.hooks.processAssets.tapPromise(PLUGIN_NAME, async (assets) => {
      const precacheUrls = assets
        .filter(({ path }) =>
          PRECACHE_EXTENSIONS.some((ext) => path.endsWith(ext)),
        )
        .map(({ path }) => path);

      const swCode = await loadTemplate('sw.ts', {
        __VERSION__: JSON.stringify(String(Date.now())),
        __PRECACHE_URLS__: `[${precacheUrls.map((u) => JSON.stringify(u)).join(',')}]`,
        __STATIC_EXT_REGEX__: JSON.stringify(buildExtPattern(PRECACHE_EXTENSIONS)),
        __RUNTIME_EXT_REGEX__: JSON.stringify(buildExtPattern(RUNTIME_EXTENSIONS)),
        __CONTENT_UPDATED__: JSON.stringify(CONTENT_UPDATED),
      });

      return [...assets, { path: SW_FILE_PATH, content: Buffer.from(swCode) }];
    });
  },
});
