import { rejects, strictEqual } from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import {
  SlideConfigGlobalKey,
  SlideConfigReadyEvent,
  type SlideConfig,
} from '@blog/mdx-slide/shared';
import { describe, it } from '@blog/test-toolkit';
import { afterEach, beforeEach } from 'mocha';
import { waitForSlideConfig } from '../wait-for-slide-config';

const browser = globalThis as typeof globalThis & { [SlideConfigGlobalKey]?: unknown };
const keys = [SlideConfigGlobalKey, 'addEventListener', 'removeEventListener'] as const;
const original = keys.map((key) => Object.getOwnPropertyDescriptor(browser, key));
const config: SlideConfig = {
  sections: [{ steps: [] }],
};
let events: EventTarget;

describe('等待 PPT 动画配置', () => {
  beforeEach(() => {
    events = new EventTarget();
    Object.defineProperties(browser, {
      [SlideConfigGlobalKey]: { value: undefined, configurable: true, writable: true },
      addEventListener: { value: events.addEventListener.bind(events), configurable: true },
      removeEventListener: { value: events.removeEventListener.bind(events), configurable: true },
    });
  });

  afterEach(() => {
    keys.forEach((key, i) => {
      const descriptor = original[i];

      if (descriptor) {
        Object.defineProperty(browser, key, descriptor);
      }
      else {
        Reflect.deleteProperty(browser, key);
      }
    });
  });

  it('数据先到时直接读取，无需再次发送事件', async () => {
    browser[SlideConfigGlobalKey] = config;
    strictEqual(await waitForSlideConfig(new AbortController().signal), config);
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
  });

  it('播放器先启动时等通知，完成后移除配置与取消监听', async () => {
    const controller = new AbortController();
    const pending = waitForSlideConfig(controller.signal);
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 1);
    browser[SlideConfigGlobalKey] = config;
    events.dispatchEvent(new Event(SlideConfigReadyEvent));
    strictEqual(await pending, config);
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
    strictEqual(getEventListeners(controller.signal, 'abort').length, 0);
  });

  it('等待超时后清理监听，下一次启动仍能读取后到的数据', async () => {
    const controller = new AbortController();
    await rejects(waitForSlideConfig(controller.signal, 5), /加载超时/);
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
    strictEqual(getEventListeners(controller.signal, 'abort').length, 0);
    browser[SlideConfigGlobalKey] = config;
    strictEqual(await waitForSlideConfig(new AbortController().signal), config);
  });

  it('取消旧实例不会影响新实例的等待', async () => {
    const old = new AbortController();
    const current = new AbortController();
    const aborted = rejects(waitForSlideConfig(old.signal), { name: 'AbortError' });
    const pending = waitForSlideConfig(current.signal);
    old.abort();
    await aborted;
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 1);
    strictEqual(getEventListeners(old.signal, 'abort').length, 0);
    browser[SlideConfigGlobalKey] = config;
    events.dispatchEvent(new Event(SlideConfigReadyEvent));
    strictEqual(await pending, config);
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
  });

  it('已取消的启动即使已有配置也不继续，并保留取消原因', async () => {
    browser[SlideConfigGlobalKey] = config;
    const controller = new AbortController();
    const reason = new Error('播放器已卸载');
    controller.abort(reason);
    await rejects(waitForSlideConfig(controller.signal), (error) => error === reason);
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
  });

  it('已有配置的基本结构无效时拒绝启动', async () => {
    for (const invalid of [
      null,
      {},
      { sections: 'invalid' },
      { ...config, sections: [] },
      { ...config, sections: [null] },
      { ...config, sections: [{ steps: [null] }] },
    ]) {
      browser[SlideConfigGlobalKey] = invalid;
      await rejects(waitForSlideConfig(new AbortController().signal), /配置无效/);
      strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
    }
  });

  it('收到通知但没有有效数据时立即报错并清理监听', async () => {
    const controller = new AbortController();
    const invalid = rejects(waitForSlideConfig(controller.signal), /配置无效/);
    events.dispatchEvent(new Event(SlideConfigReadyEvent));
    await invalid;
    strictEqual(getEventListeners(events, SlideConfigReadyEvent).length, 0);
    strictEqual(getEventListeners(controller.signal, 'abort').length, 0);
  });
});
