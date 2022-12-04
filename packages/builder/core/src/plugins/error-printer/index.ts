import type { BuilderPlugin } from '@blog/types';
import { Instance } from 'chalk';
import { isErrorData, toString } from './utils';

const pluginName = 'error-printer';

export const ErrorPrinter = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { terminalColor: color } = builder.options;
    const printer = new Instance({ level: color ? 3 : 0 });

    builder.hooks.fail.tap(pluginName, (error) => {
      const errors: Error[] = Array.isArray(error) ? error : [error];

      for (const err of errors) {
        if (isErrorData(err)) {
          console.log(toString(err, printer));
        }
      }
    });
  },
});
