import { serve } from './serve';
import { mkdirp } from '@blog/utils';

import Chokidar from 'chokidar';
import mfs from 'memfs';
import path from 'path';

export type FileData = Record<string, Buffer | string>;
export type BuildCb = () => Promise<[string, FileData | undefined]>;

export function load(watchDir: string, cb: BuildCb) {
  const watcher = Chokidar.watch(watchDir);
  const fs = mfs.fs.promises;
  const dirCache: Record<string, boolean> = {};

  watcher.on('all', async () => {
    const result = await cb();
    const files = result[1] ?? {};
    const filesList = Object.keys(files);
    const styleFiles = filesList.filter((name) => path.extname(name) === '.css');
    const scriptFiles = filesList.filter((name) => path.extname(name) === '.js');
    const index = `
    <html>
      <head>
        ${styleFiles.map((link) => `<link href="${link}" rel="stylesheet">`)}
      </head>
      <body>
        <div id="app">
          ${result[0] ?? ''}
        </div>
        ${scriptFiles.map((link) => `<script src="${link}" />`)}
      </body>
    </html>
    `;

    await mkdirp('/', dirCache, fs);
    await fs.writeFile('/index.html', index);

    for (const filePath of Object.keys(files)) {
      const fullPath = path.join('/', filePath);
      await mkdirp(path.dirname(fullPath), dirCache, fs);
      await fs.writeFile(fullPath, files[filePath]);
    }
  });

  serve(fs as any, '/', 9966);
}
