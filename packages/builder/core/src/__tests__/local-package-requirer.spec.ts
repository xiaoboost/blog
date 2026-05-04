import { expect, describe, it } from '@blog/test-toolkit';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';

/** 创建最小化的 mock builder，只包含插件需要访问的属性 */
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
  };

  return { builder, resolveHooks, loadHooks };
}

describe('LocalPackageRequirer', () => {
  it('外部 npm 包 resolve 时被拦截并添加 module 后缀', () => {
    const { builder, resolveHooks } = createMockBuilder();
    LocalPackageRequirer().apply(builder as any);

    const result = resolveHooks[0]({
      path: 'react',
      kind: 'import-statement',
      namespace: 'file',
      importer: '/app/src/index.ts',
      resolveDir: '/app/src',
    });

    expect(result).not.undefined;
    expect(result!.namespace).eq('local-package');
    expect(result!.path).match(/_local-module$/);
  });

  it('@blog 内部包不拦截', () => {
    const { builder, resolveHooks } = createMockBuilder();
    LocalPackageRequirer().apply(builder as any);

    const result = resolveHooks[0]({
      path: '@blog/posts',
      kind: 'import-statement',
      namespace: 'file',
      importer: '/app/src/index.ts',
      resolveDir: '/app/src',
    });

    expect(result).undefined;
  });

  it('相对路径不拦截', () => {
    const { builder, resolveHooks } = createMockBuilder();
    LocalPackageRequirer().apply(builder as any);

    const result = resolveHooks[0]({
      path: './utils',
      kind: 'import-statement',
      namespace: 'file',
      importer: '/app/src/index.ts',
      resolveDir: '/app/src',
    });

    expect(result).undefined;
  });

  it('node 内置模块不拦截', () => {
    const { builder, resolveHooks } = createMockBuilder();
    LocalPackageRequirer().apply(builder as any);

    const result = resolveHooks[0]({
      path: 'fs',
      kind: 'import-statement',
      namespace: 'file',
      importer: '/app/src/index.ts',
      resolveDir: '/app/src',
    });

    expect(result).undefined;
  });

  it('css 导入不拦截', () => {
    const { builder, resolveHooks } = createMockBuilder();
    LocalPackageRequirer().apply(builder as any);

    const result = resolveHooks[0]({
      path: 'some-css-lib',
      kind: 'import-rule',
      namespace: 'file',
      importer: '/app/src/style.css',
      resolveDir: '/app/src',
    });

    expect(result).undefined;
  });

  it('已命中 local-package namespace 的 require 路径保持原 namespace', () => {
    const { builder, resolveHooks } = createMockBuilder();
    LocalPackageRequirer().apply(builder as any);

    const result = resolveHooks[0]({
      path: '/app/src/index.ts_require',
      kind: 'import-statement',
      namespace: 'local-package',
      importer: '/app/src/other.ts',
      resolveDir: '/app/src',
    });

    expect(result).not.undefined;
    expect(result!.namespace).eq('local-package');
  });

  describe('load hook', () => {
    it('require 后缀路径返回 createRequire 代码', () => {
      const { builder, loadHooks } = createMockBuilder();
      LocalPackageRequirer().apply(builder as any);

      const result = loadHooks[0]({
        namespace: 'local-package',
        path: '/app/src/index.ts_require',
      });

      expect(result.contents).match(/createRequire/);
      expect(result.loader).eq('ts');
      expect(result.resolveDir).eq('/app/src');
    });

    it('module 后缀路径返回 localRequire 调用代码', () => {
      const { builder, loadHooks } = createMockBuilder();
      LocalPackageRequirer().apply(builder as any);

      const result = loadHooks[0]({
        namespace: 'local-package',
        path: '/app/src/index.ts_react_local-module',
      });

      expect(result.contents).match(/localRequire\('react'\)/);
      expect(result.loader).eq('ts');
    });

    it('非 local-package namespace 不处理', () => {
      const { builder, loadHooks } = createMockBuilder();
      LocalPackageRequirer().apply(builder as any);

      const result = loadHooks[0]({
        namespace: 'file',
        path: '/app/src/index.ts',
      });

      expect(result).undefined;
    });
  });
});
