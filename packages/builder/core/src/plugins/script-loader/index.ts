import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { getScriptBuilder } from './builder';
import { EntrySuffix, builderCache } from './utils';

const pluginName = 'script-loader';

export const ScriptLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { mode },
    } = builder;

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (!EntrySuffix.test(args.path)) {
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

    builder.hooks.afterBundler.tap(pluginName, () => {
      for (const child of builderCache.values()) {
        for (const asset of child.getAssets()) {
          if (mode === 'production' && asset.path.endsWith('.map')) {
            continue;
          }

          builder.emitAsset(asset);
        }
      }
    });
  },
});
