import * as path from 'path';
import * as fs from 'fs';

import type { Stats } from 'memfs/lib/Stats';

interface FileSystem {
  stat(path: string): Promise<fs.Stats | Stats>;
  mkdir(path: string): Promise<void>;
}

export async function mkdirp(
  target: string,
  map: Record<string, boolean> = {},
  vfs: FileSystem = fs.promises,
) {
  // 待创建的路径
  const dirs: string[] = [];
  const exist = (target: string) => {
    return vfs.stat(target)
      .then((data: any) => Boolean(data))
      .catch(() => false);
  };

  let dir = target;

  while (!(await exist(dir))) {
    dirs.push(dir);
    dir = path.dirname(dir);
  }

  while (dirs.length > 0) {
    const dir = dirs.pop()!;

    if (map[dir]) {
      return;
    }

    map[dir] = true;
    await vfs.mkdir(dir);
  }
}
