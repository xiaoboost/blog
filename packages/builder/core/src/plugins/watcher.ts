import type { BuilderPlugin, BuilderInstance } from '@blog/types';
import type { FSWatcher } from 'chokidar';
import { isAbsolute, join } from 'path';

const pluginName = 'watcher-plugin';

export function getWatcher(builder: BuilderInstance) {
  let watcherTemp: FSWatcher | undefined;

  builder.hooks.watcher.tap(pluginName, (watcher) => {
    watcherTemp = watcher;
  });

  return () => watcherTemp;
}

export const Watcher = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { watch } = builder.options;

    if (!watch) {
      return;
    }

    const watcherTemp = getWatcher(builder);
    const files = new Set<string>();

    builder.hooks.watcher.tap(pluginName, (watcher) => {
      let ready = false;

      const changeHandler = async (file: string) => {
        const fullPath = join(watcherTemp()!.options.cwd!, file);
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
      bundler.hooks.load.tap(pluginName, ({ path: filePath }) => {
        if (isAbsolute(filePath) && !files.has(filePath)) {
          files.add(filePath);
          watcherTemp()!.add(filePath);
        }

        return null;
      });
    });

    builder.hooks.done.tap(pluginName, () => {
      const watcher = watcherTemp();

      if (watcher) {
        watcher.close();
      }
    });
  },
});
