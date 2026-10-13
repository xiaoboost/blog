import { getPostMetaData } from '@blog/parser';
import type { BuilderPlugin } from '@blog/types';

const pluginName = 'slide-assets';

/** Slide 自动收集文章目录中的资源，其他模板仍由作者显式导入。 */
export const SlideAssets = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.transform.tap({ name: pluginName, stage: -200 }, (input, ctx) => {
        if (input.format !== 'mdx' || !input.module.sourcePath) {
          return input;
        }

        const meta = getPostMetaData(input.code, input.module.sourcePath);

        if (meta.template !== 'slide') {
          return input;
        }

        let name = '__slideAssets';
        while (input.code.includes(name)) {
          name += '_';
        }

        return ctx.update(input, {
          code: input.code.replace(
            /^(---[\s\S]+?---)/,
            `$1\n\nimport ${name} from 'assets:./**/*.{script,jss}.ts';\n\n`,
          ),
          map: null,
        });
      });
    });
  },
});
