import path from 'path';

import { resolveRoot } from '../utils/path';

export const resolveFile = (dir: string, file: string) => path.resolve(
  process.cwd(),
  path.relative(process.cwd(), dir),
  file,
);

export const resolveTemplate = (...paths: string[]) => {
  return resolveRoot('templates', ...paths);
};
