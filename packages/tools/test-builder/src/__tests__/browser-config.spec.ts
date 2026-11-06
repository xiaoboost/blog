import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { describe, it } from '@blog/test-toolkit';
import type { BuildContext } from '@blog/types';
import { BrowserConfigGlobalKey, BrowserConfigReadyEvent } from '../../../../builder/context/src/runtime/browser-config';
import { defineUtils, mergeUtils } from '../../../../builder/context/src/runtime/hook/assets';
import { emitBrowserConfig } from '../../../../builder/generator/src/browser-config';
import { Page } from '../../../../builder/generator/src/model/page';

function page(pathname = '/example/') {
  return new Page({
    type: 'not-found',
    pathname,
    title: 'test',
    data: {},
    render: () => '',
  });
}

const output = {
  rename: () => '/scripts/browser-config.hash.js',
  site: { publicPath: '/base/' } as BuildContext['site'],
};

describe('页面浏览器配置', () => {
  it('utils 合并配置但不把按需资源加入首屏引用，各页面追加互不污染', () => {
    const template = defineUtils(['/player.js'], {
      browserConfig: { lazyScripts: { export: ['/export.js'] } },
    });
    const component = defineUtils([], {
      browserConfig: { lazyScripts: { editor: ['/editor.js'] } },
    });
    const combined = mergeUtils(template, component, template);
    assert.deepEqual(combined.getAssetNames(), ['/player.js']);
    assert.deepEqual(combined.getBrowserConfig(), {
      lazyScripts: { export: ['/export.js'], editor: ['/editor.js'] },
    });
    const first = page();
    const second = page('/second/');
    first.addBrowserConfig(combined.getBrowserConfig());
    second.addBrowserConfig(combined.getBrowserConfig());
    first.addBrowserConfig({ lazyScripts: { own: ['/own.js'] } });
    assert.equal(second.getBrowserConfig().lazyScripts?.own, undefined);
    assert.equal(template.getBrowserConfig().lazyScripts?.own, undefined);
    assert.throws(() => mergeUtils(template, defineUtils([], {
      browserConfig: { lazyScripts: { export: ['/another.js'] } },
    })), /名称冲突/);
  });

  it('空配置不生成文件或 head 标签', () => {
    const empty = page();
    empty.addBrowserConfig({ lazyScripts: {} });
    emitBrowserConfig(empty, output);
    assert.deepEqual(empty.getAssets(), []);
    assert.deepEqual(empty.getPreScripts(), []);
  });

  it('每页生成一份配置文件，地址使用 publicPath，赋值后通知就绪', () => {
    const current = page();
    current.addBrowserConfig({ lazyScripts: { export: ['/scripts/export.js', '/scripts/export.js.map'] } });
    emitBrowserConfig(current, output);
    const [asset] = current.getAssets();
    assert.equal(current.getAssets().length, 1);
    assert.equal(asset.path, '/example/scripts/browser-config.hash.js');
    assert.deepEqual(current.getPreScripts(), [
      {
        id: BrowserConfigGlobalKey,
        src: asset.path,
        async: true,
      },
    ]);
    let notified = false;
    const browser: Record<string, any> = {
      Event,
      dispatchEvent: (event: Event) => {
        assert.equal(event.type, BrowserConfigReadyEvent);
        assert.equal(browser[BrowserConfigGlobalKey].lazyScripts.export[0], '/base/scripts/export.js');
        notified = true;
      },
    };
    runInNewContext(asset.content.toString(), browser);
    assert.equal(notified, true);
    assert.equal(browser[BrowserConfigGlobalKey].lazyScripts.export.length, 1);
    assert.deepEqual(current.getBrowserConfig().lazyScripts?.export,
      ['/scripts/export.js', '/scripts/export.js.map']);
  });

  it('配置中的脚本文本作为数据输出，不执行其中的内容', () => {
    const current = page();
    const name = '";globalThis.injected=true;//</script>\n';
    current.addBrowserConfig({ lazyScripts: { [name]: ['/export.js'] } });
    emitBrowserConfig(current, output);
    const browser: Record<string, any> = { Event, dispatchEvent: () => true };
    runInNewContext(current.getAssets()[0].content.toString(), browser);
    assert.equal(browser.injected, undefined);
    assert.equal(browser[BrowserConfigGlobalKey].lazyScripts[name][0], '/base/export.js');
  });
});
