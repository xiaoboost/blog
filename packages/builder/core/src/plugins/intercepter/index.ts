import type { BuilderPlugin } from '@blog/types';
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

      const { logger } = builder;
      const options: Required<DebuggerOptions> = {
        // 默认排除自己
        excludes: [pluginName].concat(opt?.excludes ?? []),
      };

      Hook.intercept(pluginName, builder, options);

      builder.hooks.start.tap(pluginName, () => {
        Hook.clear();
      });

      builder.hooks.success.tap(pluginName, () => {
        Hook.printHookData(logger);
      });
    },
  };
};
