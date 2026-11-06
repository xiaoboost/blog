import type { BrowserConfig } from '@blog/types';
import { BrowserConfigGlobalKey, BrowserConfigReadyEvent } from '../runtime/browser-config';

/** 等待并获取浏览器配置 */
export function waitForBrowserConfig(signal: AbortSignal, timeout = 8000): Promise<BrowserConfig> {
  const browser = globalThis as typeof globalThis & { [BrowserConfigGlobalKey]?: BrowserConfig };
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();

    // 配置脚本在 head 中；没有标签表示本页未生成配置，无需等待事件。
    if (browser[BrowserConfigGlobalKey] === undefined
      && !document.getElementById(BrowserConfigGlobalKey)) {
      resolve({});
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('浏览器配置加载超时。'));
    }, timeout);
    function cleanup() {
      clearTimeout(timer);
      browser.removeEventListener(BrowserConfigReadyEvent, onReady);
      signal.removeEventListener('abort', onAbort);
    }
    function onReady() {
      const config = browser[BrowserConfigGlobalKey];
      cleanup();

      if (config && typeof config === 'object' && !Array.isArray(config)) {
        resolve(config);
      }
      else {
        reject(new Error('浏览器配置无效。'));
      }
    }
    function onAbort() {
      cleanup();
      reject(signal.reason);
    }

    if (browser[BrowserConfigGlobalKey] !== undefined) {
      onReady();
      return;
    }

    browser.addEventListener(BrowserConfigReadyEvent, onReady);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
