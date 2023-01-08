import type { BuilderPlugin } from '@blog/types';
import { DevServer } from './server';

const pluginName = 'development';

export const Cleaner = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { watch },
    } = builder;

    if (!watch) {
      return;
    }

    const server = new DevServer();

    builder.hooks.success.tapPromise(pluginName, async () => {
      server.writeFiles(builder.getAssets());
      server.start();
    });

    builder.hooks.done.tapPromise(pluginName, () => {
      return server.close();
    });
  },
});
