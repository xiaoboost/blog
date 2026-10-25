import { resolve } from 'path';
import { writeFile } from '@blog/node';
import type { BuilderPlugin } from '@blog/types';
import { getHookData, intercept, print } from './hooks';
import type { AllPluginData } from './hooks/types';
import { getBuildReport, printTimings } from './report';
import type { DebuggerOptions } from './types';

const pluginName = 'interceptor';

/** 调试模式下收集、打印统计，并按需导出报告文件。 */
export const Interceptor = (opt?: DebuggerOptions): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    if (builder.isChild() || !builder.options.debug) {
      return;
    }

    const data: AllPluginData = new Map();
    intercept(pluginName, builder, data, {
      excludes: [pluginName].concat(opt?.excludes ?? []),
    });

    builder.hooks.buildEnd.tapPromise(pluginName, async () => {
      const timings = builder.getTimings();
      const hooks = getHookData(data);
      const failed = builder.getErrors().length > 0;

      printTimings(builder.logger, timings, failed);
      print(builder.logger, hooks);

      if (builder.options.reportFile) {
        await writeFile(
          resolve(builder.root, builder.options.reportFile),
          getBuildReport(timings, { failed, hooks }),
        );
      }
    });
  },
});
