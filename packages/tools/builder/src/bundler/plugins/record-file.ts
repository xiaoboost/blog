import type { PluginBuild, Plugin } from 'esbuild';

export interface FilePlugin {
  getFiles(): string[];
  plugin: Plugin;
}

export function FileRecorder(): FilePlugin {
  const files = new Set<string>();

  return {
    getFiles() {
      return Array.from(files.keys());
    },
    plugin: {
      name: 'record-file',
      setup(esbuild: PluginBuild) {
        esbuild.onLoad({ filter: /\.m?(t|j)sx?$/ }, (args) => {
          files.add(args.path);
          return null;
        });
      },
    },
  };
}
