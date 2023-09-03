import type { CacheAccessor, BuilderPlugin } from '@blog/types';
import { join, dirname } from 'path';
import { normalize } from '@blog/node';
import { readFile, writeFile, mkdir } from 'fs/promises';

export const CacheController = (): BuilderPlugin => ({
  name: 'cacheController',
  apply(builder) {
    const {
      root,
      options: { cache },
    } = builder;

    const basePath = join(root, cache);

    builder.getCacheAccessor = (name): CacheAccessor => {
      return {
        get path() {
          return normalize(join(basePath, name));
        },
        read(target): Promise<Buffer | undefined> {
          return readFile(normalize(join(basePath, name, String(target)))).catch(() => void 0);
        },
        write(path, content) {
          const realPath = normalize(join(basePath, name, String(path)));
          return mkdir(dirname(realPath), { recursive: true }).then(() =>
            writeFile(realPath, content),
          );
        },
      };
    };
  },
});
