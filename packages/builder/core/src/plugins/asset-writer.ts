import type { BuilderPlugin } from '@blog/types';
import { join, dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const pluginName = 'asset-writer';

export const AssetWriter = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { outDir },
    } = builder;

    builder.hooks.success.tapPromise(pluginName, async (assets) => {
      await Promise.all(
        assets.map(async (item) => {
          const fullPath = join(outDir, item.path);
          await mkdir(dirname(fullPath), { recursive: true });
          await writeFile(fullPath, item.content);
        }),
      );
    });
  },
});
