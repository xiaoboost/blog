import yargs from 'yargs';

export const buildOptions: Record<string, yargs.Options> = {
  mode: {
    type: 'string',
    describe: '编译模式',
    choices: ['development', 'production'],
    default: 'production',
  },
  outDir: {
    type: 'string',
    describe: '输出文件夹',
    default: 'dist',
  },
};

export const watchOptions: Record<string, yargs.Options> = {
  mode: {
    type: 'string',
    describe: '编译模式',
    choices: ['development', 'production'],
    default: 'development',
  },
  hmr: {
    type: 'boolean',
    describe: '是否启用热更新',
    default: true,
  },
};
