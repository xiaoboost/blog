import { waitForBrowserConfig } from './browser-config';
import { getScriptExports } from './script-export';

/** 资源映射 */
const resources = new Map<string, Promise<unknown>>();

/** 加载资源 */
function loadResourceByUrl(url: URL): Promise<unknown> {
  const cached = resources.get(url.href);

  if (cached) {
    return cached;
  }

  const pending = new Promise<unknown>((resolve, reject) => {
    const element = url.pathname.endsWith('.css')
      ? Object.assign(document.createElement('link'), { rel: 'stylesheet', href: url.href })
      : Object.assign(document.createElement('script'), { src: url.href, async: false });
    element.onload = () => {
      element.onload = null;
      element.onerror = null;
      resolve(getScriptExports(element as HTMLScriptElement));
    };
    element.onerror = () => {
      element.remove();
      resources.delete(url.href);
      reject(new Error(`异步资源加载失败：${url.href}`));
    };
    document.head.appendChild(element);
  });
  resources.set(url.href, pending);
  return pending;
}

/** 读取异步资源 */
export async function loadResource<T = void>(
  name: string,
  signal = new AbortController().signal,
): Promise<T> {
  const config = await waitForBrowserConfig(signal);
  const paths = config.lazyScripts?.[name];

  if (!paths) {
    throw new Error(`未配置异步脚本：${name}`);
  }

  const urls = paths.map((path) => new URL(path, document.baseURI));
  await Promise.all(urls.filter((url) => url.pathname.endsWith('.css')).map(loadResourceByUrl));

  let result: unknown;

  for (const url of urls.filter((url) => url.pathname.endsWith('.js'))) {
    signal.throwIfAborted();
    result = await loadResourceByUrl(url);
  }

  return result as T;
}
