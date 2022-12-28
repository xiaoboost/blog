import type { BuilderPlugin } from '@blog/types';
import { join } from 'path';

const pluginName = 'watcher-plugin';

export const Watcher = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { watch } = builder.options;

    if (!watch) {
      return;
    }

    builder.hooks.watcher.tap(pluginName, (watcher) => {
      let ready = false;

      const changeHandler = async (file: string) => {
        const fullPath = join(watcher.options.cwd!, file);
        await builder.hooks.filesChange.promise([fullPath]);
        await builder.build();
      };

      watcher
        .on('ready', () => {
          if (!ready) {
            ready = true;
            watcher.on('change', changeHandler);
          }
        })
        .once('restart', () => {
          ready = false;
          watcher
            .removeAllListeners('change')
            .removeAllListeners('add')
            .removeAllListeners('unlink');
        });
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tap(pluginName, ({ path }) => {
        builder.addWatchFiles(path);
        return null;
      });
    });

    builder.hooks.done.tap(pluginName, () => {
      const { watcher } = builder;

      if (watcher) {
        watcher.close();
      }
    });
  },
});
