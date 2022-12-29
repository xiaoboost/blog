import type { Loader } from '@blog/types';

export type RealLoader = Exclude<Loader, 'file' | 'path'>;

export interface ParsedLoader {
  loader: Record<string, RealLoader>;
  files: string[];
  paths: string[];
}

export function parseLoader(data: Record<string, Loader>): ParsedLoader {
  const files: string[] = [];
  const paths: string[] = [];
  const realLoader: Record<string, RealLoader> = {};

  for (const [ext, loader] of Object.entries(data)) {
    if (loader === 'file') {
      files.push(ext);
      continue;
    }

    if (loader === 'path') {
      paths.push(ext);
      continue;
    }

    realLoader[ext] = loader;
  }

  return {
    loader: realLoader,
    files,
    paths,
  };
}
