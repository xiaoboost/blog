import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, describe, it } from '@blog/test-toolkit';
import { build } from 'esbuild';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { BridgePlugin } from '../bundler/bridge';
import { LocalPackageRequirer } from '../plugins/local-package-requirer';
import { Resolver } from '../plugins/resolver';

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
      pluginData: { kind: 'module', importer: '/app/src/index.ts', request: 'react' },
    });

    expect(result).not.undefined;
    expect(result!.namespace).eq('local-package');
  });

  describe('load hook', () => {
    it('两层模块通过 pluginData 接续，内置 module 请求正常交给后续 resolver', () => {
      const { builder, resolveHooks, loadHooks } = createMockBuilder();
      LocalPackageRequirer().apply(builder as any);
      const resolve = resolveHooks[0];
      const load = loadHooks[0];
      const importer = '/app/src/file_with_underscores.ts';
      const request = 'package_name/sub_entry';
      const mod = resolve({ path: request, namespace: 'file', importer });
      const source = load(mod);

      expect(mod.path).eq(`${importer}_${request}_local-module`);
      expect(source.contents).eq(`import localRequire from '${importer}_require';\nexport = localRequire('${request}');`);

      const helper = resolve({
        path: `${importer}_require`,
        namespace: mod.namespace,
        importer: mod.path,
        pluginData: source.pluginData,
      });
      const helperSource = load(helper);

      expect(helperSource.contents).eq(`import { createRequire } from "module";\nexport default createRequire("${importer}");`);
      expect(resolve({
        path: 'module',
        namespace: helper.namespace,
        importer: helper.path,
        pluginData: helperSource.pluginData,
      })).undefined;
    });

    it('require 后缀路径返回 createRequire 代码', () => {
      const { builder, loadHooks } = createMockBuilder();
      LocalPackageRequirer().apply(builder as any);

      const result = loadHooks[0]({
        namespace: 'local-package',
        path: '/app/src/index.ts_require',
        pluginData: { kind: 'require', importer: '/app/src/index.ts' },
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
        pluginData: { kind: 'module', importer: '/app/src/index.ts', request: 'react' },
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

  it('实际打包保留两个子包各自的依赖版本，且不打包依赖源码', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-local-package-'));
    const builder = new Builder({ root, logLevel: 'Silence', typeCheck: false });
    const bundler = new Bundler(builder);

    try {
      LocalPackageRequirer().apply(builder);
      Resolver().apply(builder);
      builder.hooks.bundler.call(bundler);
      for (const name of ['one', 'two']) {
        const directory = join(root, name);
        const dependency = join(directory, 'node_modules/dep_name');
        await mkdir(dependency, { recursive: true });
        await writeFile(join(dependency, 'package.json'), JSON.stringify({
          name: 'dep_name',
          version: name === 'one' ? '1.0.0' : '2.0.0',
        }));
        await writeFile(join(dependency, 'sub_entry.cjs'), `module.exports = '${name}_dependency_source';`);
        await writeFile(join(directory, 'with_underscore.ts'), "export { default } from 'dep_name/sub_entry.cjs';");
      }
      const entry = join(root, 'index.ts');
      await writeFile(entry, "import one from './one/with_underscore'; import two from './two/with_underscore'; export default [one, two];");
      const result = await build({
        entryPoints: [entry],
        bundle: true,
        write: false,
        platform: 'node',
        format: 'cjs',
        plugins: [BridgePlugin(bundler, builder)],
      });
      const code = result.outputFiles![0].text;
      const module = { exports: {} as any };
      runInNewContext(code, { module, exports: module.exports, require });

      expect([...module.exports.default]).deep.eq(['one_dependency_source', 'two_dependency_source']);
      expect(code).not.contain('dependency_source');
    }
    finally {
      await bundler.dispose();
      await builder.stop();
      await rm(root, { recursive: true, force: true });
    }
  });
});
