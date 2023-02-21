import type { BuilderPlugin } from '@blog/types';
import { debounce } from '@xiao-ai/utils';
import { normalize } from '@blog/node';
import { realpath } from 'fs/promises';
import { join } from 'path';

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
        builder.setChangeFiles(...changeFiles);
        await builder.hooks.filesChange.promise(changeFiles);
        if (builder.shouldBuild) {
          await builder.build();
        }
      }, 200);
      const changeHandler = async (file: string) => {
        const realPath = normalize(await realpath(join(watcher.options.cwd!, file)));
        changeMap.add(realPath);
        await reBuild();
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
