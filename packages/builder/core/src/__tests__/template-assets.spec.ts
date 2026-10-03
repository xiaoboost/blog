import { describe, expect, it } from '@blog/test-toolkit';
import type { TemplateAsset } from '@blog/types';
import { defineUtils, mergeUtils, withScriptOptions } from '../../../context/src/runtime/hook/assets';

describe('模板资源引用', () => {
  it('兼容混合路径数组，自动分类且不丢失图片和字体引用', () => {
    const paths = [
      '/layout.js', '/layout.css', '/font.woff2', '/image.png', '/layout.js',
    ];
    const utils = defineUtils(paths);
    expect(utils.getScripts()).deep.eq([{ src: '/layout.js' }]);
    expect(utils.getStyles()).deep.eq([{ href: '/layout.css' }]);
    expect(utils.getPreScripts()).deep.eq([]);
    expect(utils.getAssetNames()).deep.eq(paths.slice(0, -1));
    expect(defineUtils().getAssetNames()).deep.eq([]);
  });

  it('显式配置覆盖普通引用，合并后 head 脚本不回到 body，预加载不会变成样式标签', () => {
    const base = defineUtils(['/shared.js', '/shared.css']);
    const configured = defineUtils([
      { src: '/shared.js', position: 'head', defer: true, crossOrigin: 'anonymous' },
      { href: '/shared.css', media: 'print' },
      { href: '/later.css', as: 'style' },
      { href: '/font.woff2', as: 'font', media: 'print' },
      { href: '/font.woff2', as: 'font', media: 'screen' },
    ]);
    const merged = mergeUtils(base, configured, base, configured);
    expect(merged.getScripts()).deep.eq([]);
    expect(merged.getPreScripts()).deep.eq([{ src: '/shared.js', defer: true, crossOrigin: 'anonymous' }]);
    expect(merged.getStyles()).deep.eq([{ href: '/shared.css', media: 'print' }]);
    expect(merged.getPreloadAssets()).length(3);
    expect(merged.getAssetNames()).deep.eq([
      '/shared.js', '/shared.css', '/later.css', '/font.woff2',
    ]);
    expect(base.getScripts()).deep.eq([{ src: '/shared.js' }]);
  });

  it('成组配置只处理 JS，CSS、字体和图片仍按原来的方式收集', () => {
    const paths = [
      '/theme.js?version=1', '/theme.css', '/font.woff2', '/image.png',
    ];
    const utils = defineUtils(withScriptOptions(paths, { position: 'head', type: 'module' }));
    expect(utils.getPreScripts()).deep.eq([{ src: paths[0], type: 'module' }]);
    expect(utils.getScripts()).deep.eq([]);
    expect(utils.getStyles()).deep.eq([{ href: paths[1] }]);
    expect(utils.getAssetNames()).deep.eq(paths);
  });

  it('替换路径保留标签配置并同步预加载，调用方修改快照不影响原引用', () => {
    const references: TemplateAsset[] = [
      { src: '/old.js', position: 'head', async: true },
      { href: '/old.js', as: 'script' },
    ];
    const utils = defineUtils(references);
    (references[0] as { src: string }).src = '/outside.js';
    (utils.getAssetReferences()[0] as { src: string }).src = '/snapshot.js';
    utils.getPreScripts()[0].async = false;
    utils.replaceAssetName('/old.js', '/new.js');
    expect(utils.getPreScripts()).deep.eq([{ src: '/new.js', async: true }]);
    expect(utils.getPreloadAssets()).deep.eq([{ href: '/new.js', as: 'script' }]);
    utils.insertAssetNames('/first.css');
    utils.addAssetNames('/last.css');
    utils.addPreloadAssets({ href: '/font.woff2', as: 'font' });
    expect(utils.getAssetNames()).deep.eq([
      '/first.css', '/new.js', '/last.css', '/font.woff2',
    ]);
  });
});
