import yargs from 'yargs';

import { build, watch } from '../bundler';

function setBuildOption(yargs: yargs.Argv<any>) {
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

function setWatchOption(yargs: yargs.Argv<any>) {
  return yargs.options({
    mode: {
      type: 'string',
      describe: '构建模式',
      choices: ['development', 'production'],
      default: 'development',
    },
    hmr: {
      type: 'boolean',
      describe: '是否启用 HMR 功能',
      default: true,
    },
  });
}

export function run() {
  yargs
    .command(
      ['build'],
      'build',
      (yargs) => setBuildOption(yargs),
      (argv) => build(argv),
    )
    .command(
      ['watch'],
      'watch',
      (yargs) => setWatchOption(yargs),
      (argv) => watch(argv),
    )
    .strict()
    .showHelpOnFail(false).argv;
}
