import type { BuilderPlugin } from '@blog/types';
import { createResolver } from '../utils';

const pluginName = 'resolver';

export const Resolver = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { root } = builder;
    const resolve = createResolver({
      root,
    });

    builder.resolve = resolve;

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap({ name: pluginName, stage: 999 }, (args) => {
        return resolve(args.path, args);
      });
    });
  },
});
