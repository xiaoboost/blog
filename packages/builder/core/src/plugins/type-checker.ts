import type { BuilderPlugin } from '@blog/types';
import { Helper, PluginConfig } from 'vite-esbuild-typescript-checker/dist/helper';

const pluginName = 'type-checker';

export const ScriptLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options } = builder;
    const helper = new Helper({
      vite: {
        overlay: false,
      },
      checker: {
        async: true,
      },
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.loadResult.tap(pluginName, (_, args) => {
        if (/\.jsx?|\.tsx?$/.test(args.path)) {
          helper.addFile(args.path);
        }
      });
    });

    builder.hooks.afterBundler.tap(pluginName, () => {
      // if (!result.errors.length) {
      //   await helper.workerStart(undefined, !!options.watch);
      // }
    });
  },
});
