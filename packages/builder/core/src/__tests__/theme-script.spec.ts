import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { createContext, runInContext } from 'vm';
import { describe, expect, it } from '@blog/test-toolkit';
import { build } from 'esbuild';
import { before } from 'mocha';

const themePath = resolve(
  __dirname, '../../../../templates/layout/src/components/theme-toggle/theme.script.ts',
);

async function bundleTheme(mode: 'production' | 'development') {
  const source = await readFile(themePath, 'utf-8');
  const result = await build({
    stdin: {
      // 与 script-loader 一样移除仅用于类型检查的虚拟导出。
      contents: source.replace(/export default assets;/, ''),
      loader: 'ts', resolveDir: dirname(themePath), sourcefile: themePath,
    },
    bundle: true, write: false, platform: 'browser', format: 'iife',
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
  });
  return result.outputFiles[0].text;
}

function eventTarget() {
  const listeners = new Map<string, Set<(event: any) => void>>();
  return {
    addEventListener(name: string, listener: (event: any) => void) {
      const set = listeners.get(name) ?? new Set();
      set.add(listener);
      listeners.set(name, set);
    },
    removeEventListener(name: string, listener: (event: any) => void) {
      listeners.get(name)?.delete(listener);
    },
    dispatch(name: string, event: object = {}) {
      listeners.get(name)?.forEach((listener) => listener(event));
    },
  };
}

function createButton() {
  return {
    ...eventTarget(),
    title: '', disabled: true,
    attributes: new Map<string, string>(),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
  };
}

function createPage(saved: string | null = null, storageBlocked = false) {
  const storage = new Map<string, string>(saved === null ? [] : [['blog-theme', saved]]);
  let button: ReturnType<typeof createButton> | undefined;
  let queries = 0;
  const document = {
    ...eventTarget(),
    readyState: 'loading',
    documentElement: { dataset: {} as Record<string, string> },
    currentScript: { getAttribute: () => '/scripts/theme.js' } as object | null,
    querySelector: (selector: string) => {
      queries++;
      return selector === '[data-theme-toggle]' ? button ?? null : null;
    },
  };
  const context = createContext({
    ...eventTarget(),
    document,
    localStorage: {
      getItem(key: string) {
        if (storageBlocked) throw new Error('storage blocked');
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        if (storageBlocked) throw new Error('storage blocked');
        storage.set(key, value);
      },
      removeItem(key: string) {
        if (storageBlocked) throw new Error('storage blocked');
        storage.delete(key);
      },
    },
  });
  context.window = context;
  const mountButton = () => (button = createButton());
  return { context, document, storage, mountButton, queryCount: () => queries };
}

describe('head 主题脚本', () => {
  let production: string;
  let development: string;
  let hmr: string;

  before(async () => {
    [production, development] = await Promise.all([bundleTheme('production'), bundleTheme('development')]);
    hmr = (await build({
      entryPoints: [resolve(__dirname, '../plugins/development/runtime/module.ts')],
      bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'hmrRuntime',
    })).outputFiles[0].text;
  });

  it('head 阶段立即恢复主题，等 DOM 就绪后再启用按钮并持久化切换结果', () => {
    const page = createPage('dark');
    runInContext(production, page.context);
    expect(page.document.documentElement.dataset.theme).eq('dark');
    expect(page.queryCount()).eq(0);
    const button = page.mountButton();
    page.document.currentScript = null;
    page.document.readyState = 'interactive';
    page.document.dispatch('DOMContentLoaded');
    expect(button.disabled).false;
    expect(button.attributes.get('aria-label')).include('暗色模式');
    button.dispatch('click');
    expect(page.document.documentElement.dataset.theme).undefined;
    expect(page.storage.has('blog-theme')).false;
    button.dispatch('click');
    expect(page.document.documentElement.dataset.theme).eq('light');
    expect(page.storage.get('blog-theme')).eq('light');
    page.context.dispatch('storage', { key: 'blog-theme', newValue: 'dark' });
    expect(page.document.documentElement.dataset.theme).eq('dark');
    page.context.dispatch('storage', { key: null, newValue: null });
    expect(page.document.documentElement.dataset.theme).undefined;
  });

  it('存储被禁用、偏好无效或 DOM 已就绪时仍可切换', () => {
    for (const blocked of [false, true]) {
      const page = createPage('invalid', blocked);
      const button = page.mountButton();
      page.document.readyState = 'complete';
      runInContext(production, page.context);
      expect(page.document.documentElement.dataset.theme).undefined;
      expect(button.disabled).false;
      button.dispatch('click');
      expect(page.document.documentElement.dataset.theme).eq('light');
    }
  });

  it('晚于主题脚本加载的 HMR 客户端仍能注册模块，并在正文替换后重新绑定按钮', () => {
    const page = createPage('light');
    runInContext(development, page.context);
    runInContext(hmr, page.context);
    page.document.currentScript = null;
    page.document.readyState = 'interactive';
    const first = page.mountButton();
    page.document.dispatch('DOMContentLoaded');
    expect(first.disabled).false;
    const second = page.mountButton();
    page.context.hmrRuntime.module.reload();
    expect(first.disabled).true;
    expect(second.disabled).false;
    first.dispatch('click');
    expect(page.document.documentElement.dataset.theme).eq('light');
    second.dispatch('click');
    expect(page.document.documentElement.dataset.theme).eq('dark');
    page.context.hmrRuntime.module.uninstall('/scripts/theme.js');
    expect(second.disabled).true;
    page.context.dispatch('storage', { key: 'blog-theme', newValue: 'light' });
    expect(page.document.documentElement.dataset.theme).eq('dark');
  });
});
