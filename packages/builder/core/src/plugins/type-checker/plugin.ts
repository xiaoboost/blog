import { BuilderPlugin } from '@blog/types';
import { createTypeCheckerClient } from './client';

const pluginName = 'type-checker';

export const typeCheckPlugin = (): BuilderPlugin => {
  return {
    name: pluginName,
    apply(builder) {
      builder.hooks.initialization.tap(pluginName, async () => {
        try {
          require.resolve('typescript');
        } catch (e) {
          // console.warn('未发现`typescript`包');
          return;
        }

        createTypeCheckerClient(builder.root).connect();
      });
    },
  };
};
