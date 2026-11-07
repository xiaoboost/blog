import { createHash } from 'crypto';
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
} from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { expect, describe, it } from '@blog/test-toolkit';
import type { Mdx, PostExportData } from '@blog/types';
import { devDependencies } from '../../package.json';
import {
  getImportedByPost,
  getTsCodeBlockCode,
  isInstallCurrent,
  npmInstall,
} from '../utils';

function block(code: string): Mdx.MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'TsCodeBlock',
    attributes: [],
    children: [{ type: 'mdxFlowExpression', value: JSON.stringify(code) }],
  };
}

function post(children: Mdx.RootContent[]): PostExportData {
  return { data: { ast: { type: 'root', children } } } as PostExportData;
}

describe('TS code block source', () => {
  it('还原 parser 生成的字符串，保留引号、反斜杠、模板插值和换行', () => {
    const source = [
      'import { value } from "example-package";',
      String.raw`const path = "C:\temp";`,
      'const text = `中文 ${value}`;',
      '',
    ].join('\n');
    expect(getTsCodeBlockCode(block(source))).eq(source);
    expect(getImportedByPost([post([block(source)])]).has('example-package')).true;
  });

  it('保留手写组件表达式的源码扫描，不执行表达式', () => {
    const node = block('');
    const source = '`import { value } from "example-package";`';
    node.children = [{ type: 'mdxFlowExpression', value: source }];
    expect(getTsCodeBlockCode(node)).eq(source);
    expect(getImportedByPost([post([node])]).has('example-package')).true;
  });

  it('跳过缺少代码和非字符串值的组件', () => {
    const node = block('');
    node.children = [];
    expect(getTsCodeBlockCode(node)).undefined;
    node.children = [{ type: 'mdxFlowExpression', value: '42' }];
    expect(getTsCodeBlockCode(node)).undefined;
  });
});

describe('LSP dependency scanning', () => {
  it('普通代码围栏由 parser 决定是否转换，组件扫描不再重复判断配置', () => {
    const code: Mdx.Code = { type: 'code', lang: 'ts', value: 'import "example-package";' };
    expect([...getImportedByPost([post([code])])]).deep.eq([]);
  });

  it('扫描嵌套和隐藏的 TS 组件', () => {
    const hidden = block('import { value } from "example-package";');
    hidden.attributes = [
      {
        type: 'mdxJsxAttribute', name: 'visible',
        value: { type: 'mdxJsxAttributeValueExpression', value: 'false' },
      },
    ];
    const nested: Mdx.Blockquote = { type: 'blockquote', children: [hidden] };
    const result = getImportedByPost([post([nested])]);
    expect(result.has('example-package')).true;
    expect(result.has(`@types/react@${devDependencies['@types/react']}`)).true;
  });

  it('保持依赖去重和本地模块过滤', () => {
    const source = [
      'import "example-package";',
      'import "example-package";',
      'import "./local";',
      'import "fs";',
      'import "@blog/node";',
      'import "@@local/helper";',
    ].join('\n');
    const result = [...getImportedByPost([post([block(source), block(source)])])];
    expect(result.filter((name) => !name.startsWith('@types/'))).deep.eq(['example-package']);
  });
});

describe('LSP install cache', () => {
  async function withCache(run: (cwd: string) => Promise<void>) {
    const cwd = await mkdtemp(join(tmpdir(), 'blog-lsp-install-'));
    try {
      const pkg = JSON.stringify({ devDependencies: { '@types/example': '1.0.0' } });
      const lock = JSON.stringify({
        packages: {
          '': {},
          'node_modules/@types/example': { version: '1.0.0' },
          'node_modules/transitive': { version: '2.0.0' },
        },
      });
      for (const [name, version] of [['@types/example', '1.0.0'], ['transitive', '2.0.0']]) {
        const dir = join(cwd, 'node_modules', name);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'package.json'), JSON.stringify({ name, version }));
      }
      await writeFile(join(cwd, 'package.json'), pkg);
      await writeFile(join(cwd, 'package-lock.json'), JSON.stringify({
        packages: {
          ...JSON.parse(lock).packages,
          'node_modules/other-platform': { version: '1.0.0', optional: true },
        },
      }));
      await writeFile(join(cwd, 'node_modules/.package-lock.json'), lock);
      await writeFile(join(cwd, '.blog-install.json'), JSON.stringify({
        libs: ['@types/example@1.0.0'],
        fingerprint: createHash('sha256').update(pkg + JSON.stringify({
          packages: {
            ...JSON.parse(lock).packages,
            'node_modules/other-platform': { version: '1.0.0', optional: true },
          },
        }) + lock).digest('hex'),
      }));
      await run(cwd);
    }
    finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }

  it('已有完整磁盘缓存时跳过 npm，包括进程重启后的首次调用', async () => {
    await withCache(async (cwd) => {
      const logs: string[] = [];
      await npmInstall(['@types/example@1.0.0'], cwd, (msg) => logs.push(msg));
      expect(logs).deep.eq(['依赖缓存完整，跳过 npm install']);
    });
  });

  it('新增依赖或版本改变时重新安装', async () => {
    await withCache(async (cwd) => {
      expect(await isInstallCurrent(['new-package'], cwd)).false;
      expect(await isInstallCurrent(['@types/example@2.0.0'], cwd)).false;
    });
  });

  it('传递依赖缺失或实际版本改变时重新安装', async () => {
    await withCache(async (cwd) => {
      await writeFile(join(cwd, 'node_modules/transitive/package.json'), '{"version":"3.0.0"}');
      expect(await isInstallCurrent(['@types/example@1.0.0'], cwd)).false;
      await rm(join(cwd, 'node_modules/transitive'), { recursive: true });
      expect(await isInstallCurrent(['@types/example@1.0.0'], cwd)).false;
    });
  });

  for (const file of [
    'package.json',
    'package-lock.json',
    'node_modules/.package-lock.json',
    '.blog-install.json',
  ]) {
    it(`${file} 改变或损坏时重新安装`, async () => {
      await withCache(async (cwd) => {
        await writeFile(join(cwd, file), '{}');
        expect(await isInstallCurrent(['@types/example@1.0.0'], cwd)).false;
        await rm(join(cwd, file));
        expect(await isInstallCurrent(['@types/example@1.0.0'], cwd)).false;
      });
    });
  }
});
