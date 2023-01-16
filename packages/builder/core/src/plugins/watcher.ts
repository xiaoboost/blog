import type { BuilderPlugin } from '@blog/types';
import { debounce } from '@xiao-ai/utils';
import { normalize } from '@blog/node';

const pluginName = 'watcher';

export const Watcher = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { watch } = builder.options;

    if (!watch) {
      return;
    }

    const reBuild = debounce(() => builder.build(), 500);

    builder.hooks.watcher.tap(pluginName, (watcher) => {
      let ready = false;

      const changeHandler = async (file: string) => {
        const fullPath = normalize(watcher.options.cwd!, file);
        builder.setChangeFiles(fullPath);
        await builder.hooks.filesChange.promise([fullPath]);

        if (builder.shouldBuild) {
          await reBuild();
        }
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
      bundler.hooks.resolveResult.tap(pluginName, ({ path, watchFiles }) => {
        if (watchFiles) {
          watchFiles.forEach((file) => builder.addWatchFiles(file));
        } else if (path) {
          builder.addWatchFiles(path);
        }
      });
      bundler.hooks.loadResult.tap(pluginName, ({ watchFiles }) => {
        watchFiles?.forEach((file) => builder.addWatchFiles(file));
      });
    });

    builder.hooks.done.tap(pluginName, ({ watcher }) => {
      if (watcher) {
        watcher.close();
      }
    });
  },
});
