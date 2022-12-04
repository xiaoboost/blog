import type { BuilderPlugin } from '@blog/types';
import { isErrorData, toString } from './utils';

const pluginName = 'error-printer';

export const ErrorPrinter = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.fail.tap(pluginName, (error) => {
      const errors: Error[] = Array.isArray(error) ? error : [error];

      for (const err of errors) {
        if (isErrorData(err)) {
          console.log(toString(err));
        }
      }
    });
  },
});
