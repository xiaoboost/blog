import { join } from 'path';
import type { BuilderPlugin } from '@blog/types';
import { TypeCheckerOptions, EventName } from './types';
import { WorkerController, ErrorData } from '../../utils';

export { TypeCheckerOptions, TypeScriptConfig } from './types';

const pluginName = 'type-checker';

export const TypeChecker = (opt?: TypeCheckerOptions): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const worker = new WorkerController(join(__dirname, './server/index.worker.js'));

    builder.hooks.afterInitialized.tap(pluginName, () => {
      worker.send({
        name: EventName.StartServer,
        params: [
          {
            basePath: opt?.basePath ?? builder.options.root,
            configOverwrite: opt?.configOverwrite ?? {},
            configFile: opt?.configFile ?? 'tsconfig.json',
            typescriptPath: opt?.typescriptPath ?? require.resolve('typescript'),
          },
        ],
      });
    });

    builder.hooks.filesChange.tap(pluginName, (files) => {
      worker.send({
        name: EventName.FilesChanged,
        params: files,
      });
    });

    builder.hooks.afterBundler.tapPromise(pluginName, async () => {
      const result = await worker.send<ErrorData[]>({
        name: EventName.GetTsDiagnostics,
      });

      debugger;
      if (result.length > 0) {
        throw result;
      }
    });

    builder.hooks.done.tap(pluginName, () => {
      worker.send({
        name: EventName.Dispose,
      });
    });
  },
});
