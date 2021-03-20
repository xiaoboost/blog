import path from 'path';

export const resolveFile = (dir: string, file: string) => path.resolve(
  process.cwd(),
  path.relative(process.cwd(), dir),
  file,
);
