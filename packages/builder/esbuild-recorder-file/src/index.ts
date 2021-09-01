import type { PluginBuild, Loader } from 'esbuild';

import * as fs from 'fs';
import * as path from 'path';

export function FileRecorder() {
  let files: Record<string, boolean> = {};

  return {
    getFiles() {
      return Object.keys(files);
    },
    pushFile(file: string) {
      files[file] = true;
    },
    plugin: {
      name: 'record-file',
      setup(esbuild: PluginBuild) {
        files = {};

        esbuild.onLoad({ filter: /\.(t|j)sx?$/ }, async (args) => {
          files[args.path] = true;

          try {
            const code = await fs.promises.readFile(args.path, 'utf-8');

            return {
              contents: code,
              loader: path.extname(args.path).slice(1) as Loader,
              resolveDir: path.dirname(args.path),
            };
          }
          catch (e: any) {
            return {
              errors: [{
                text: e.message,
              }],
            };
          }
        });
      },
    },
  };
}
