import type { BuilderPlugin, ErrorData } from '@blog/types';
import { isObject } from '@xiao-ai/utils';

const pluginName = 'asset-extractor';

export const cssFileName = 'jss.css';
export const cssClassesName = 'jss.json';

interface StyleSheetOutput {
  classes: Record<string, string>;
  toString(): string;
}

function isStyleSheet(obj: unknown): obj is StyleSheetOutput {
  return isObject(obj) && 'classes' in obj && typeof (obj as any).toString === 'function';
}

export const AssetExtractor = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options } = builder;
    const minify = options.mode === 'production';

    builder.hooks.afterRunner.tapPromise(pluginName, async ({ runner }) => {
      const output = runner.getOutput();

      if (!isStyleSheet(output)) {
        const data: ErrorData = {
          name: 'JSS',
          project: 'JSS',
          filePath: options.entry,
          message: 'style 文件的默认导出应该是 StyleSheet 实例',
        };

        throw data;
      }

      const cssCode = output.toString();
      const classesCode = minify
        ? JSON.stringify(output.classes ?? {})
        : JSON.stringify(output.classes ?? {}, null, 2);

      builder.emitAsset({
        path: cssFileName,
        content: Buffer.from(cssCode),
      });
      builder.emitAsset({
        path: cssClassesName,
        content: Buffer.from(classesCode),
      });
    });
  },
});
