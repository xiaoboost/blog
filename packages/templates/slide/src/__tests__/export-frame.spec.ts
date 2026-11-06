import { rejects, strictEqual } from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { describe, it } from '@blog/test-toolkit';
import { afterEach, beforeEach } from 'mocha';
import { waitForExportFrame } from '../export/frame';

const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
let fontsReady: Promise<unknown>;
const frame = (decode: () => Promise<unknown>) => ({
  querySelectorAll: () => [{ decode }],
}) as unknown as HTMLElement;

describe('导出副本资源准备', () => {
  beforeEach(() => {
    fontsReady = Promise.resolve();
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        fonts: {
          get ready() {
            return fontsReady;
          },
        },
      },
    });
  });

  afterEach(() => {
    if (original) {
      Object.defineProperty(globalThis, 'document', original);
    }
    else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  });

  it('字体和图片都就绪后才允许截图，完成后移除取消监听', async () => {
    let finishFonts!: () => void;
    let finishImage!: () => void;
    fontsReady = new Promise<void>((resolve) => {
      finishFonts = resolve;
    });
    const imageReady = new Promise<void>((resolve) => {
      finishImage = resolve;
    });
    const controller = new AbortController();
    let ready = false;
    const waiting = waitForExportFrame(frame(() => imageReady), controller.signal)
      .then(() => {
        ready = true;
      });
    finishImage();
    await imageReady;
    strictEqual(ready, false);
    finishFonts();
    await waiting;
    strictEqual(ready, true);
    strictEqual(getEventListeners(controller.signal, 'abort').length, 0);
  });

  it('图片失败会中止导出，不吞掉错误生成缺图 PDF', async () => {
    const error = new Error('broken image');
    const controller = new AbortController();
    await rejects(waitForExportFrame(frame(() => Promise.reject(error)), controller.signal), error);
    strictEqual(getEventListeners(controller.signal, 'abort').length, 0);
  });

  it('等待途中取消和启动前取消都结束等待，并保留取消原因', async () => {
    const controller = new AbortController();
    const error = new Error('player disposed');
    const pending = frame(() => new Promise(() => {}));
    const waiting = waitForExportFrame(pending, controller.signal);
    controller.abort(error);
    await rejects(waiting, error);
    await rejects(waitForExportFrame(pending, controller.signal), error);
    strictEqual(getEventListeners(controller.signal, 'abort').length, 0);
  });
});
