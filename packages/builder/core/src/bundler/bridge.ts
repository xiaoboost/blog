import type { Plugin, PluginBuild } from 'esbuild';
import type { Bundler } from './bundler';

export const BridgePlugin = (bundler: Bundler): Plugin => {
  return {
    name: 'bridge-plugin',
    setup: (esbuild: PluginBuild) => {
      esbuild.onResolve({ filter: /.*/ }, (resolveArgs) => {
        return bundler.hooks.resolve.promise(resolveArgs);
      });
      esbuild.onLoad({ filter: /.*/ }, (loadArgs) => {
        return bundler.hooks.load.promise(loadArgs);
      });
    },
  };
};
