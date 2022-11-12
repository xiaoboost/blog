import type { Plugin, PluginBuild } from 'esbuild';
import type { Bundler } from './bundler';

export const BridgePlugin = (bundler: Bundler): Plugin => {
  return {
    name: 'bridge-plugin',
    setup: (esbuild: PluginBuild) => {
      esbuild.onResolve({ filter: /.*/ }, (options) => {
        debugger;
        return null;
      });
      esbuild.onLoad({ filter: /.*/ }, (options) => {
        debugger;
        return null;
      });
    },
  };
};
