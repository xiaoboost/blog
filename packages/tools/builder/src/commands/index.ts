import yargs from 'yargs';

import { build } from './build';
import { watch } from './watch';

function setYargsCommand(yargs: yargs.Argv<any>) {
  return yargs.options({
    outDir: {
      type: 'string',
      describe: '输出文件夹',
      require: true,
    },
    mode: {
      type: 'string',
      describe: '构建模式',
      choices: ['development', 'production'],
      default: 'development',
    },
  });
}

export function run() {
  yargs
    .command(
      ['build'],
      'build',
      (yargs) => setYargsCommand(yargs),
      (argv) => build(argv),
    )
    .command(
      ['watch'],
      'watch',
      (yargs) => setYargsCommand(yargs),
      (argv) => watch(argv),
    )
    .strict()
    .showHelpOnFail(false).argv;
}
