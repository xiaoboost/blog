import type { BuilderPlugin } from '@blog/types';
import { join } from 'path';
import { writeFile } from 'fs/promises';

const pluginName = 'assets-writer';

export const AssetsWriter = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { root } = builder;

    builder.hooks.success.tap(pluginName, (assets) => {
      // ..
    });
  },
});
