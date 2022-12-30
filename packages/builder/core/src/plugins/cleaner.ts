import type { BuilderPlugin } from '@blog/types';
import { rmdir } from 'fs/promises';

const pluginName = 'cleaner';

export const Cleaner = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { outDir },
    } = builder;

    builder.hooks.start.tapPromise(pluginName, async () => {
      try {
        await rmdir(outDir, { recursive: true });
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    });
  },
});
