import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { getScriptBuilder } from './builder';
import { EntrySuffix } from './utils';

const pluginName = 'script-loader';

export const ScriptLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options } = builder;

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (!EntrySuffix.test(args.path)) {
          return;
        }

        // 入口则跳过
        if (args.path === options.entry) {
          return;
        }

        const scriptBuilder = await getScriptBuilder(args.path, builder);
        const assets = scriptBuilder.getAssets();

        return {
          contents: `export default [\n  ${assets
            .map((item) => `"${item.path}"`)
            .join(',\n  ')},\n]`,
          loader: 'js',
          resolveDir: dirname(args.path),
        };
      });
    });
  },
});
