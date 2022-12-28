import type { BuilderPlugin } from '@blog/types';
import { join } from 'path';
import { writeFile } from 'fs/promises';

const pluginName = 'dist-writer';

export const DiskWriter = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { root } = builder;

    builder.hooks.success.tap(pluginName, (assets) => {
      // ..
    });
  },
});
