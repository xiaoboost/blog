import type { BuilderPlugin } from '@blog/types';
import { cname } from '../constant';

const pluginName = 'cname';

export const Cname = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.processAssets.tap(pluginName, (assets) => {
      return assets.concat({
        path: '/CNAME',
        content: Buffer.from(cname),
      });
    });
  },
});
