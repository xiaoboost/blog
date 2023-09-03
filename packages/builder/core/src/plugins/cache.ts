import type { CacheAccessor, BuilderPlugin } from '@blog/types';
import { join } from 'path';
import { normalize } from '@blog/node';
import { readFile, writeFile } from 'fs/promises';

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
        read(target): Promise<Buffer | undefined> {
          try {
            return readFile(normalize(join(basePath, name, String(target))));
          } catch (e) {
            return Promise.resolve(undefined);
          }
        },
        write(path, content) {
          return writeFile(normalize(join(basePath, name, String(path))), content);
        },
      };
    };
  },
});
