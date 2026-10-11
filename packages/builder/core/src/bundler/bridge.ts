import type { BuilderInstance, BundlerInstance } from '@blog/types';
import type { Plugin, PluginBuild } from 'esbuild';
import { loadAndTransform } from './pipeline';

export const BridgePlugin = (bundler: BundlerInstance, builder: BuilderInstance): Plugin => {
  return {
    name: 'bridge-plugin',
    setup: (esbuild: PluginBuild) => {
      esbuild.onResolve({ filter: /.*/ }, async (resolveArgs) => {
        const result = await bundler.hooks.resolve.promise(resolveArgs);

        if (result) {
          await bundler.hooks.resolveResult.promise(result, resolveArgs);
        }

        return result ?? null;
      });
      esbuild.onLoad({ filter: /.*/ }, async (loadArgs) => {
        const result = await loadAndTransform(
          builder,
          bundler.hooks,
          loadArgs,
          esbuild.initialOptions,
        );
        return result ?? null;
      });
    },
  };
};
