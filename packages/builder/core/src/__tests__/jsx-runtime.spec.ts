import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, it } from 'mocha';
import { Builder } from '../builder';
import { Bundler } from '../bundler';

describe('JSX 自动运行时', () => {
  const reactRequire = createRequire(resolve(__dirname, '../../../../templates/slide/package.json'));
  const source = `
import { renderToStaticMarkup } from 'react-dom/server';
const props = { id: 'note' };
export const html = renderToStaticMarkup(<>
  <p {...props} key="note">无需导入 React</p>
  <span>谢谢你看到这里。</span>
</>);
`;

  for (const virtual of [false, true]) {
    it(`${virtual ? '插件生成的 JSX' : '没有 tsconfig 的 TSX'} 无需 React 全局变量即可渲染`, async () => {
      const root = await mkdtemp(join(tmpdir(), 'blog-jsx-runtime-'));
      const entry = join(root, 'entry.tsx');
      const builder = new Builder({
        root,
        entry,
        logLevel: 'Silence',
        typeCheck: false,
      });
      const bundler = new Bundler(builder);
      bundler.hooks.initialization.tap('external-react', (options) => ({ ...options, packages: 'external' }));

      try {
        if (virtual) {
          await writeFile(entry, "export { html } from 'virtual:jsx-page';");
          bundler.hooks.resolve.tap('virtual-jsx', ({ path }) => path === 'virtual:jsx-page'
            ? { path, namespace: 'jsx-page' }
            : undefined);
          bundler.hooks.load.tap('virtual-jsx', ({ namespace }) => namespace === 'jsx-page'
            ? { contents: source, loader: 'jsx', resolveDir: root }
            : undefined);
        }
        else {
          await writeFile(entry, source);
        }

        await bundler.bundle();
        const module = { exports: {} as { html: string } };
        runInNewContext(bundler.getBundledCode().source, {
          module, exports: module.exports, require: reactRequire,
        });
        assert.equal(module.exports.html, '<p id="note">无需导入 React</p><span>谢谢你看到这里。</span>');
      }
      finally {
        await bundler.dispose();
        await builder.stop();
        await rm(root, { recursive: true, force: true });
      }
    });
  }
});
