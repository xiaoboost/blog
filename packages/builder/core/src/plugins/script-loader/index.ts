import type { BuilderPlugin } from '@blog/types';
import { postAssetsNamespace } from '../post-loader/assets';
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
      bundler.hooks.transform.tapPromise(pluginName, async (input, ctx) => {
        const path = input.module.id.namespace === postAssetsNamespace
          ? input.module.id.path
          : input.module.sourcePath;

        if (!path || !EntrySuffix.test(path)) {
          return input;
        }

        const scriptBuilder = await getScriptBuilder(path, builder, input);
        const assets = scriptBuilder.getAssets();

        return ctx.update(input, {
          code: `export default [\n${assets.map((item) => `  "${item.path}",\n`).join('')}]`,
          format: 'js',
          map: null,
        });
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
