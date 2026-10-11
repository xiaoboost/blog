import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'mocha';
import { LanguageService } from '../plugins/type-checker/server/server';

describe('Watch 类型检查', () => {
  it('忽略图片、字体和目录事件，仍检查修改后的源码', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blog-watch-types-'));
    let server: LanguageService | undefined;
    try {
      const entry = join(root, 'entry.ts');
      const image = join(root, 'image.svg');
      const font = join(root, 'font.woff2');
      const pages = join(root, 'pages');
      await mkdir(pages);
      await writeFile(entry, 'export const value: number = 1;');
      await writeFile(image, '<svg><text>resource</text></svg>');
      await writeFile(font, Buffer.from([
        0,
        1,
        2,
        255,
      ]));
      await writeFile(join(root, 'tsconfig.json'), JSON.stringify({
        files: ['entry.ts'],
        compilerOptions: { strict: true, types: [] },
      }));
      server = new LanguageService({
        basePath: root,
        configFile: 'tsconfig.json',
        configOverwrite: {},
        typescriptPath: require.resolve('typescript'),
      });
      assert.deepEqual(server.getDiagnostics(), []);
      server.filesChanged(image, font, pages);
      assert.deepEqual(server.getDiagnostics(), []);

      await writeFile(entry, 'export const value: number = "invalid";');
      server.filesChanged(entry.replaceAll('\\', '/'));
      assert.ok(server.getDiagnostics().some((error) => error.name === 'TS2322'));
    }
    finally {
      server?.dispose();
      await rm(root, { recursive: true, force: true });
    }
  });
});
