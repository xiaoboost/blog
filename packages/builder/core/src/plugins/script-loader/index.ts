import type { BuilderPlugin, BuilderInstance } from '@blog/types';
import { dirname } from 'path';
import { getScriptBuilder } from './builder';
import { EntrySuffix } from './utils';

const pluginName = 'script-loader';

export const ScriptLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { entry: parentEntry, mode },
    } = builder;
    const builderCache = new Map<string, BuilderInstance>();

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (!EntrySuffix.test(args.path)) {
          return;
        }

        // 入口则跳过
        if (args.path === parentEntry) {
          return;
        }

        const scriptBuilder = builderCache.has(args.path)
          ? builderCache.get(args.path)!
          : await getScriptBuilder(args.path, builder);
        const assets = scriptBuilder.getAssets();

        if (!builderCache.has(args.path)) {
          builderCache.set(args.path, scriptBuilder);
        }

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

    builder.hooks.done.tap(pluginName, () => {
      builderCache.clear();
    });
  },
});
