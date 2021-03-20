import path from 'path';

const cwd = process.cwd();

export function resolveRoot(...paths: string[]) {
  return path.join(cwd, ...paths);
}

export function resolveCli(...paths: string[]) {
  return path.join(cwd, ...paths);
}
