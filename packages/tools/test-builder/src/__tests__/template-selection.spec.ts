import assert from 'node:assert/strict';
import { Builder } from '@blog/core';
import { describe, it } from '@blog/test-toolkit';

async function buildWithTemplate(template: string | undefined) {
  const data = {
    title: '模板选择测试',
    pathname: '/template-selection/',
    filePath: '/articles/template-selection.mdx',
    create: Date.UTC(2026, 0, 1),
    update: Date.UTC(2026, 0, 1),
    tags: [],
    public: true,
    draft: false,
    toc: false,
    lsp: false,
    template,
    description: '验证生成器只接受明确注册的模板',
    ast: { type: 'root', children: [] },
  };
  const builder = new Builder({
    mode: 'production',
    write: false,
    logLevel: 'Silence',
    typeCheck: false,
    plugins: [
      {
        name: 'test-template-selection',
        apply(builder) {
          builder.hooks.bundler.tap('test-template-selection', (bundler) => {
            bundler.hooks.load.tap({ name: 'test-template-selection', stage: -100 }, (args) => {
              if (args.namespace !== 'posts-loader') {
                return;
              }

              // 模拟 parser 处理后的导出，确保报错来自 generator 的模板检查。
              return {
                contents: `
                  import { defineUtils } from '@blog/context/runtime';
                  export default [{
                    data: ${JSON.stringify(data)},
                    Component: () => null,
                    utils: defineUtils(),
                  }];
                `,
                resolveDir: args.pluginData,
              };
            });
          });
        },
      },
    ],
  });

  try {
    await builder.init();
    await builder.build();
    return {
      errors: builder.getErrors().map(({ message }) => message).join('\n'),
      html: builder.getAssets().filter(({ path }) => path.endsWith('.html')),
    };
  }
  finally {
    await builder.stop();
  }
}

describe('文章模板映射', function () {
  this.timeout(60_000);

  for (const template of [
    'unknown',
    '',
    'constructor',
    '__proto__',
    undefined,
  ]) {
    const name = JSON.stringify(template) ?? 'undefined';
    it(`拒绝未注册的模板 ${name}，不回退到 post`, async () => {
      const result = await buildWithTemplate(template);
      assert.ok(result.errors.includes(`未知文章模板 ${name}`), result.errors);
      assert.ok(result.errors.includes('/articles/template-selection.mdx'), result.errors);
      assert.ok(result.errors.includes('支持：post, slide'), result.errors);
      assert.deepEqual(result.html, []);
    });
  }
});
