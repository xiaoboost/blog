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

  await mkdirp('/', dirCache, fs);
  await fs.writeFile('/index.html', renderToString(app));

  for (const file of assets) {
    const fullPath = path.join('/', file.path);
    await mkdirp(path.dirname(fullPath), dirCache, fs);
    await fs.writeFile(fullPath, file.contents);
  }
}
