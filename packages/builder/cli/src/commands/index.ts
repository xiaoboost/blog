import yargs from 'yargs';

import { Builder } from '@blog/core';
import { buildOptions, watchOptions } from './utils';

export function run() {
  yargs
    .command(['build'], '构建博客', buildOptions, async (argv) => {
      const builder = new Builder({
        ...argv,
        watch: false,
        write: true,
      });

      await builder.init();
      await builder.build();
    })
    .command(['watch'], '监听模式', watchOptions, async (argv) => {
      const builder = new Builder({
        ...argv,
        watch: true,
        write: false,
      });

      await builder.init();
      await builder.build();
    })
    .strict()
    .showHelpOnFail(false).argv;
}
