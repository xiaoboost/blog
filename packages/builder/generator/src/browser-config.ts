import { BrowserConfigGlobalKey, BrowserConfigReadyEvent } from '@blog/context/runtime';
import { normalize, normalizeUrl } from '@blog/node';
import type { BuildContext, IPage } from '@blog/types';

/** 在正式渲染前输出本页配置，文件与 head 引用沿用页面资源流程。 */
export function emitBrowserConfig(page: IPage, { rename, site }: Pick<BuildContext, 'rename' | 'site'>) {
  const config = page.getBrowserConfig();

  if (!Object.keys(config).length) {
    return;
  }

  if (config.lazyScripts) {
    const entries = Object.entries(config.lazyScripts).map(([name, paths]) => [
      name,
      paths.filter((path) => !path.endsWith('.map'))
        .map((path) => normalizeUrl(site.publicPath, path)),
    ]);
    config.lazyScripts = Object.fromEntries(entries);
  }

  const content = Buffer.from([
    `globalThis[${JSON.stringify(BrowserConfigGlobalKey)}] = ${JSON.stringify(config)};`,
    `globalThis.dispatchEvent(new Event(${JSON.stringify(BrowserConfigReadyEvent)}));`,
  ].join('\n'));
  const asset = { path: 'browser-config.js', content };
  const src = normalize(page.pathname, rename(asset));
  page.addAsset({ path: src, content });
  page.addPreScript({ id: BrowserConfigGlobalKey, src, async: true });
}
