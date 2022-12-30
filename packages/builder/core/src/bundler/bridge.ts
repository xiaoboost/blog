import type { Plugin, PluginBuild } from 'esbuild';
import type { Bundler } from './bundler';

export const BridgePlugin = (bundler: Bundler): Plugin => {
  return {
    name: 'bridge-plugin',
    setup: (esbuild: PluginBuild) => {
      esbuild.onResolve({ filter: /.*/ }, async (resolveArgs) => {
        const result = await bundler.hooks.resolve.promise(resolveArgs);

        if (result) {
          await bundler.hooks.resolveResult.promise(result);
        }

        return result ?? null;
      });
      esbuild.onLoad({ filter: /.*/ }, async (loadArgs) => {
        const result = await bundler.hooks.load.promise(loadArgs);

        if (result) {
          await bundler.hooks.loadResult.promise(result);
        }

        return result ?? null;
      });
    },
  };
};
