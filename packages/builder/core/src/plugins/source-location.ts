import { dirname, resolve } from 'path';
import { pathToFileURL } from 'url';
import type { BuilderPlugin, SourceMapV3 } from '@blog/types';
import MagicString from 'magic-string';
import { EntrySuffix } from './script-loader/utils';

const pluginName = 'source-location';
const formats = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
]);
// 字符串、注释、正则字面量整段跳过，只捕获代码里的完整常量名。
const matcher = new RegExp([
  String.raw`/\*[\s\S]*?\*/|//[^\r\n]*`,
  String.raw`"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'`,
  String.raw`\x60(?:\\[\s\S]|[^\x60\\])*\x60`,
  String.raw`(?<!<)/(?![*/>])(?:\\.|[^/\\\r\n])+/[dgimsuvy]*`,
  String.raw`(?<![\w$.\u0080-\uffff])(__dirname|__filename|import\s*\.\s*meta\s*\.\s*url)(?![\w$\u0080-\uffff])`,
].join('|'), 'g');

/** 构建期源码中的文件位置，在合并模块之前固定下来。 */
export const SourceLocation = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      let enabled = true;
      bundler.hooks.initialization.tap({ name: pluginName, stage: Infinity }, (options) => {
        enabled = options.platform === 'node';
        return options;
      });
      bundler.hooks.transform.tap({ name: pluginName, stage: -50 }, (input, ctx) => {
        const sourcePath = input.module.sourcePath;

        // 主构建中的 script 尚未交给浏览器子构建，入口也必须排除。
        if (
          !enabled || !sourcePath || EntrySuffix.test(sourcePath)
          || !formats.has(input.format)
          || !/__dirname|__filename|import\s*\.\s*meta\s*\.\s*url/.test(input.code)
        ) {
          return input;
        }

        const filename = resolve(sourcePath);
        const url = pathToFileURL(filename).href;
        const values = {
          __dirname: JSON.stringify(dirname(filename)),
          __filename: JSON.stringify(filename),
        };
        const edited = new MagicString(input.code);
        for (const match of input.code.matchAll(matcher)) {
          const name = match[1];

          if (!name) {
            continue;
          }

          const start = match.index!;
          const end = start + name.length;
          // 排除 obj . __dirname、对象键和赋值左侧，不做作用域分析。
          const before = input.code.slice(0, start);
          const after = input.code.slice(end);

          if (/\.\s*$/.test(before)
            || (/[{,]\s*$/.test(before) && /^\s*:/.test(after))
            || /^\s*=(?!=|>)/.test(after)) {
            continue;
          }

          const value = name.startsWith('import')
            ? JSON.stringify(url + input.module.id.suffix)
            : values[name as keyof typeof values];
          edited.overwrite(start, end, value);
        }

        if (!edited.hasChanged()) {
          return input;
        }

        const map = edited.generateMap({ source: url, includeContent: true, hires: true });
        return ctx.update(input, {
          code: edited.toString(),
          map: JSON.parse(map.toString()) as SourceMapV3,
        });
      });
    });
  },
});
