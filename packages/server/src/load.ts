import { mkdirp } from '@blog/utils';
import { renderToString } from 'react-dom/server';

import mfs from 'memfs';
import path from 'path';

export interface FileData {
  path: string;
  contents: Buffer | string;
}

export async function load(app: JSX.Element, assets: FileData[]) {
  const fs = mfs.fs.promises;
  const dirCache: Record<string, boolean> = {};
  const styleFiles = assets.filter((file) => path.extname(file.path) === '.css');
  const scriptFiles = assets.filter((file) => path.extname(file.path) === '.js');
  const index = `
  <html>
    <head>
      ${styleFiles.map((link) => `<link href="${link.path}" rel="stylesheet">`)}
    </head>
    <body>
      <div id="app">
        ${renderToString(app)}
      </div>
      ${scriptFiles.map((link) => `<script src="${link.path}" />`)}
    </body>
  </html>
  `;

  await mkdirp('/', dirCache, fs);
  await fs.writeFile('/index.html', index);

  for (const file of assets) {
    const fullPath = path.join('/', file.path);
    await mkdirp(path.dirname(fullPath), dirCache, fs);
    await fs.writeFile(fullPath, file.contents);
  }
}
