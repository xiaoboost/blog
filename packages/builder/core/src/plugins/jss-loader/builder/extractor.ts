import type { BuilderPlugin, ErrorData } from '@blog/types';
import { isObject } from '@xiao-ai/utils';

const pluginName = 'asset-extractor';

export const cssFileName = 'jss.css';
export const cssClassesName = 'jss.json';

function isJssObject(obj: unknown) {
  return isObject(obj) && 'attached' in obj && 'classes' in obj && 'rules' in obj;
}

export const AssetExtractor = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options } = builder;
    const minify = options.mode === 'production';

    builder.hooks.afterRunner.tapPromise(pluginName, async ({ runner }) => {
      const jssInstance = runner.getOutput();

      if (!isJssObject(jssInstance)) {
        const data: ErrorData = {
          name: 'JSS',
          project: 'JSS',
          filePath: options.entry,
          message: 'style 文件的默认导出应该是 jss 实例',
        };

        throw data;
      }

      const cssCode = jssInstance.toString({
        indent: 0,
        allowEmpty: false,
      });
      const classesCode = minify
        ? JSON.stringify(jssInstance.classes ?? {})
        : JSON.stringify(jssInstance.classes ?? {}, null, 2);

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
