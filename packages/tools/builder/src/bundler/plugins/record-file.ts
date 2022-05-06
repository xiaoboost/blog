import type { PluginBuild, Plugin } from 'esbuild';

export interface FilePlugin {
  getFiles(): string[];
  plugin: Plugin;
}

export function FileRecorder(): FilePlugin {
  let files: Record<string, boolean> = {};

  return {
    getFiles() {
      return Object.keys(files);
    },
    plugin: {
      name: 'record-file',
      setup(esbuild: PluginBuild) {
        files = {};
        esbuild.onLoad({ filter: /\.m?(t|j)sx?$/ }, async (args) => {
          files[args.path] = true;
          return null;
        });
      },
    },
  };
}
