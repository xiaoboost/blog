import type { BuilderPlugin, ErrorData } from '@blog/types';
import { isObject } from '@xiao-ai/utils';

const pluginName = 'jss-css-extractor';

interface CssExtractorData {
  plugin: BuilderPlugin;
  getOutput: () => {
    classes: Record<string, string>;
    cssCode: string;
  };
}

function isJssObject(obj: unknown) {
  return isObject(obj) && 'attached' in obj && 'classes' in obj && 'rules' in obj;
}

export const CssExtractor = (): CssExtractorData => {
  let output: any;

  return {
    getOutput() {
      return {
        classes: { ...output.classes } as Record<string, string>,
        cssCode: output.toString({
          indent: 0,
          allowEmpty: false,
        }),
      };
    },
    plugin: {
      name: pluginName,
      apply(builder) {
        builder.hooks.start.tap(pluginName, () => {
          output = {
            classes: {},
            toString: () => '',
          };
        });

        builder.hooks.success.tap(pluginName, (_, { runner }) => {
          output = runner.getOutput();

          if (!isJssObject(output)) {
            const data: ErrorData = {
              name: 'JSS',
              project: 'JSS',
              message: 'style 文件的默认导出应该是 jss 实例',
            };

            throw data;
          }
        });
      },
    },
  };
};
