import { realpath } from 'fs/promises';
import { resolve } from 'path';
import { normalize } from '@blog/node';
import type { BuilderPlugin } from '@blog/types';
import { debounce } from '@xiao-ai/utils';

const pluginName = 'watcher';

export const Watcher = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { watch } = builder.options;

    if (!watch) {
      return;
    }

    builder.hooks.watcher.tap(pluginName, (watcher) => {
      let ready = false;

      const changeMap = new Set<string>();
      const reBuild = debounce(async () => {
        const changeFiles = Array.from(changeMap.values());
        changeMap.clear();
        builder.setChangeFiles(...changeFiles);
        await builder.hooks.filesChange.promise(changeFiles);

        if (builder.shouldBuild) {
          await builder.build();
        }
      }, 200);
      const changeHandler = async (file: string) => {
        const path = resolve(watcher.options.cwd!, file);
        const realPath = normalize(await realpath(path).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') {
            throw error;
          }

          return path;
        }));
        changeMap.add(realPath);
        await reBuild();
      };

      watcher
        .on('ready', () => {
          if (!ready) {
            ready = true;
            watcher.on('change', changeHandler).on('add', changeHandler).on('unlink', changeHandler)
              .on('addDir', changeHandler).on('unlinkDir', changeHandler);
          }
        })
        .once('restart', () => {
          ready = false;
          watcher
            .removeAllListeners('change')
            .removeAllListeners('add')
            .removeAllListeners('unlink')
            .removeAllListeners('addDir')
            .removeAllListeners('unlinkDir');
        });
    });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolveResult.tap(pluginName, ({ path, watchFiles, watchDirs }) => {
        if (watchFiles) {
          watchFiles.forEach((file) => builder.addWatchFiles(file));
        }
        else if (path) {
          builder.addWatchFiles(path);
        }

        builder.addWatchDirs(...watchDirs ?? []);
      });
      bundler.hooks.loadResult.tap(pluginName, ({ watchFiles, watchDirs }) => {
        watchFiles?.forEach((file) => builder.addWatchFiles(file));
        builder.addWatchDirs(...watchDirs ?? []);
      });
    });

    builder.hooks.done.tapPromise(pluginName, async ({ watcher }) => {
      if (watcher) {
        await watcher.close();
      }
    });
  },
});
