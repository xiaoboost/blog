import type { BuilderPlugin } from '@blog/types';
import { join } from 'path';
import { writeFile } from '@blog/node';
import type { DebuggerOptions } from './types';

import * as Hook from './hooks';

const pluginName = 'intercepter';

export const Intercepter = (opt?: DebuggerOptions): BuilderPlugin => {
  return {
    name: pluginName,
    apply(builder) {
      if (builder.isChild()) {
        return;
      }

      const { logger, options } = builder;
      const pluginOptions: DebuggerOptions = {
        excludes: [pluginName].concat(opt?.excludes ?? []),
        outFile: opt?.outFile ? join(options.root, opt?.outFile) : undefined,
      };

      Hook.intercept(pluginName, builder, pluginOptions);

      builder.hooks.start.tap(pluginName, () => {
        Hook.clear();
      });

      builder.hooks.success.tapPromise(pluginName, async () => {
        Hook.print(logger);

        if (pluginOptions.outFile) {
          await writeFile(pluginOptions.outFile, Hook.getMdString());
        }
      });
    },
  };
};
