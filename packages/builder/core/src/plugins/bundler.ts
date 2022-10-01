import type { BuilderPlugin } from '@blog/types';

export const BundlerPlugin = (): BuilderPlugin => {
  return {
    name: 'bundler',
    apply(builder) {
      // ..
    },
  };
};
