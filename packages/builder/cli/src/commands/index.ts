import yargs from 'yargs';

import { Builder } from '@blog/core';
import { CommandOptions } from '@blog/types';
import { buildOptions, watchOptions } from './utils';

export function run() {
  yargs
    .command(['build'], '构建博客', buildOptions, async (argv) => {
      const builder = await Builder.create(argv as CommandOptions);
      await builder.build();
    })
    .command(['watch'], '监听模式', watchOptions, async (argv) => {
      const builder = await Builder.create(argv as CommandOptions);
      await builder.watch();
    })
    .strict()
    .showHelpOnFail(false).argv;
}
