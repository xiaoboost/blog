import { expect, describe, it } from '@blog/test-toolkit';
import { PathLoader } from '../plugins/path-loader';

function createMockBuilder() {
  const resolveHooks: Array<(...args: any[]) => any> = [];
  const loadHooks: Array<(...args: any[]) => any> = [];

  const mockBundler = {
    hooks: {
      resolve: {
        tap: (_name: string, fn: any) => {
          resolveHooks.push(fn);
        },
      },
      load: {
        tap: (_name: string, fn: any) => {
          loadHooks.push(fn);
        },
      },
    },
  };

  const builder = {
    hooks: {
      bundler: {
        tap: (_name: string, fn: any) => {
          fn(mockBundler);
        },
      },
    },
    resolve: (path: string) => ({ path, external: false, namespace: 'file' }),
  };

  return { builder, resolveHooks, loadHooks };
}

describe('PathLoader', () => {
  it('匹配正则的路径被拦截并注入 namespace', () => {
    const { builder, resolveHooks } = createMockBuilder();
    PathLoader({ test: /\.woff$/ }).apply(builder as any);

    const result = resolveHooks[0]({
      path: '/fonts/roboto.woff',
      kind: 'url-token',
      importer: '/src/style.css',
      resolveDir: '/src',
    });

    expect(result).not.undefined;
    expect(result!.namespace).eq('path-loader');
    expect(result!.watchFiles).deep.eq(['/fonts/roboto.woff']);
  });

  it('CSS 导入时标记为 external', () => {
    const { builder, resolveHooks } = createMockBuilder();
    PathLoader({ test: /\.woff$/ }).apply(builder as any);

    const result = resolveHooks[0]({
      path: '/fonts/roboto.woff',
      kind: 'import-rule',
      importer: '/src/style.css',
      resolveDir: '/src',
    });

    expect(result!.external).true;
  });

  it('非 CSS 导入时 external 为 false', () => {
    const { builder, resolveHooks } = createMockBuilder();
    PathLoader({ test: /\.wasm$/ }).apply(builder as any);

    const result = resolveHooks[0]({
      path: '/lib/module.wasm',
      kind: 'import-statement',
      importer: '/src/index.ts',
      resolveDir: '/src',
    });

    expect(result!.external).false;
  });

  it('不匹配正则的路径不拦截', () => {
    const { builder, resolveHooks } = createMockBuilder();
    PathLoader({ test: /\.woff$/ }).apply(builder as any);

    const result = resolveHooks[0]({
      path: '/fonts/roboto.ttf',
      kind: 'url-token',
      importer: '/src/style.css',
      resolveDir: '/src',
    });

    expect(result).undefined;
  });

  it('load 时匹配 namespace 返回路径导出', () => {
    const { builder, loadHooks } = createMockBuilder();
    PathLoader({ test: /\.woff$/ }).apply(builder as any);

    const result = loadHooks[0]({
      namespace: 'path-loader',
      path: '/fonts/roboto.woff',
    });

    expect(result.contents).eq("export default '/fonts/roboto.woff';");
    expect(result.loader).eq('js');
    expect(result.resolveDir).eq('/fonts');
  });

  it('load 时非 path-loader namespace 不处理', () => {
    const { builder, loadHooks } = createMockBuilder();
    PathLoader({ test: /\.woff$/ }).apply(builder as any);

    const result = loadHooks[0]({
      namespace: 'file',
      path: '/fonts/roboto.woff',
    });

    expect(result).undefined;
  });
});
