import type { BuilderPlugin } from '@blog/types';

const pluginName = 'bundler';

export const BundlerPlugin = (): BuilderPlugin => {
  return {
    name: pluginName,
    apply(builder) {
      builder.hooks.bundler.tapPromise(pluginName, async (bundler) => {
        const { hooks } = bundler;
        // await bundler.bundle();
      });
    },
  };
};
