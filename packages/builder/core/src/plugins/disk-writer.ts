import type { BuilderPlugin } from '@blog/types';
import { join } from 'path';
import { writeFile } from 'fs/promises';

const pluginName = 'write-dist';

export const DiskWriter = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { root } = builder;

    builder.hooks.endBuild.tap(pluginName, (assets) => {
      // ..
    });
  },
});
