import { expect, describe, it } from '@blog/test-toolkit';
import { PathLoader } from '../plugins/path-loader';

function resolvePath(path: string, kind: string) {
  let resolve: (args: any) => any;
  const bundler = {
    hooks: {
      resolve: {
        tap: (_name: string, fn: typeof resolve) => {
          resolve = fn;
        },
      },
      load: { tap() {} },
    },
  };
  const builder = {
    hooks: { bundler: { tap: (_name: string, fn: any) => fn(bundler) } },
    resolve: (path: string) => ({ path, external: false, namespace: 'file' }),
  };
  PathLoader({ test: /\.woff$/ }).apply(builder as any);
  return resolve!({
    path,
    kind,
    importer: '/src/index.ts',
    resolveDir: '/src',
  });
}

describe('PathLoader', () => {
  it('CSS 直接引用资源路径，JS 导入交给模块加载，二者都监听资源变化', () => {
    const path = '/fonts/roboto.woff';
    for (const kind of ['url-token', 'import-rule', 'import-statement']) {
      const result = resolvePath(path, kind);
      expect(result.external, kind).eq(kind !== 'import-statement');
      expect(result.watchFiles, kind).deep.eq([path]);
    }
  });

  it('不匹配的资源交给其他 loader', () => {
    expect(resolvePath('/fonts/roboto.ttf', 'url-token')).undefined;
  });
});
