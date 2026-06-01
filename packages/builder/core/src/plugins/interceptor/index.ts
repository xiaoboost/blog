import { join } from 'path';
import { writeFile } from '@blog/node';
import type { BuilderPlugin } from '@blog/types';
import * as Hook from './hooks';
import type { DebuggerOptions } from './types';

const pluginName = 'interceptor';

export const Interceptor = (opt?: DebuggerOptions): BuilderPlugin => {
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

      builder.hooks.success.tapPromise(pluginName, async () => {
        Hook.print(logger);

        if (pluginOptions.outFile) {
          await writeFile(pluginOptions.outFile, Hook.getMdString());
        }
      });
    },
  };
};
