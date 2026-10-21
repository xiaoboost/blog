import {
  SlideConfigGlobalKey,
  SlideConfigReadyEvent,
  type SlideConfig,
} from '@blog/mdx-slide/shared';

/** 只检查基本结构，动画声明的详细校验由构建端完成。 */
function isSlideConfig(value: unknown): value is SlideConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const config = value as Partial<SlideConfig>;
  return Array.isArray(config.sections) && config.sections.length > 0
    && config.sections.every((section) => section && Array.isArray(section.steps)
      && section.steps.every((step) => step && Array.isArray(step.actions)));
}

/** 数据先到时直接读取；否则等待通知。每次等待独立取消，不缓存 Promise。 */
export function waitForSlideConfig(signal: AbortSignal, timeout = 8000): Promise<SlideConfig> {
  const browser = globalThis as typeof globalThis & { [SlideConfigGlobalKey]?: unknown };

  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('幻灯片动画配置加载超时。'));
    }, timeout);

    function cleanup() {
      clearTimeout(timer);
      browser.removeEventListener(SlideConfigReadyEvent, onReady);
      signal.removeEventListener('abort', onAbort);
    }

    function onReady() {
      const config = browser[SlideConfigGlobalKey];
      cleanup();

      if (isSlideConfig(config)) {
        resolve(config);
      }
      else {
        reject(new Error('幻灯片动画配置无效。'));
      }
    }

    function onAbort() {
      cleanup();
      reject(signal.reason);
    }

    if (browser[SlideConfigGlobalKey] !== undefined) {
      onReady();
      return;
    }

    browser.addEventListener(SlideConfigReadyEvent, onReady);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
