import type { BuilderPlugin, BuilderInstance } from '@blog/types';
import type { FSWatcher } from 'chokidar';

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
    const { terminalColor: color } = builder.options;
    const watcherTemp = getWatcher(builder);

    builder.hooks.watcher.tap(pluginName, (watcher) => {
      let ready = false;

      const addHandler = (files: string[]) => {
        debugger;
      };
      const removeHandler = (files: string[]) => {
        debugger;
      };
      const changeHandler = async (files: string[]) => {
        debugger;
        await builder.hooks.filesChange.promise(files);
        await builder.build();
      };

      debugger;
      watcher
        .on('ready', () => {
          debugger;
          if (ready) {
            return;
          }

          ready = true;

          watcher.on('change', changeHandler).on('add', addHandler).on('unlink', removeHandler);
        })
        .once('restart', () => {
          ready = false;
          watcher
            .removeAllListeners('change')
            .removeAllListeners('add')
            .removeAllListeners('unlink');
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
