import { join } from 'path';
import { describe, expect, it } from '@blog/test-toolkit';
import type { OnResolveArgs } from '@blog/types';
import { Builder } from '../builder';
import { Bundler } from '../bundler';
import { JsPdfExternals } from '../plugins/script-loader/builder/jspdf-externals';

function createResolve() {
  const builder = new Builder({ root: join(__dirname, '../..') });
  const bundler = new Bundler(builder);
  JsPdfExternals().apply(builder);
  builder.hooks.bundler.call(bundler);
  return (overrides: Partial<OnResolveArgs>) => bundler.hooks.resolve.promise({
    path: 'html2canvas',
    importer: '/blog/node_modules/jspdf/dist/jspdf.es.min.js',
    kind: 'dynamic-import',
    namespace: 'file',
    resolveDir: '',
    pluginData: undefined,
    with: {},
    ...overrides,
  });
}

describe('jsPDF 可选依赖裁剪', () => {
  it('只排除 jsPDF 动态引用的三个可选依赖，兼容 Windows 和 pnpm 路径', async () => {
    const resolve = createResolve();
    for (const importer of [
      '/blog/node_modules/jspdf/dist/jspdf.es.min.js',
      'D:\\blog\\node_modules\\.pnpm\\jspdf@4.2.1\\node_modules\\jspdf\\dist\\jspdf.es.min.js',
    ]) {
      for (const path of ['html2canvas', 'dompurify', 'canvg']) {
        expect(await resolve({ path, importer })).deep.eq({ path, external: true });
      }
    }
  });

  it('保留其他模块的正常引用，以及 jsPDF 的必需依赖', async () => {
    const resolve = createResolve();
    for (const overrides of [
      { importer: '/blog/src/editor.ts' },
      { importer: '/blog/node_modules/not-jspdf/dist/index.js' },
      { kind: 'import-statement' as const },
      { path: 'fflate' },
      { path: 'fast-png' },
    ]) {
      expect(await resolve(overrides)).eq(undefined);
    }
  });
});
