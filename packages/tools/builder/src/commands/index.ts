import yargs from 'yargs';

import { build, watch } from '../bundler';

function setYargsCommand(yargs: yargs.Argv<any>) {
  return yargs.options({
    outDir: {
      type: 'string',
      describe: '输出文件夹',
      default: 'dist',
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
