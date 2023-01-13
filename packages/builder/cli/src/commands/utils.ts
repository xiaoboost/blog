import yargs from 'yargs';

const baseOptions: Record<string, yargs.Options> = {
  mode: {
    type: 'string',
    describe: '编译模式',
    choices: ['development', 'production'],
    default: 'production',
  },
  terminalColor: {
    type: 'boolean',
    describe: '命令行输出颜色',
    default: true,
  },
  logLevel: {
    type: 'string',
    describe: '输出日志等级',
    default: 'info',
    choices: ['debug', 'info', 'error'],
  },
  debug: {
    type: 'boolean',
    describe: '开启调试器',
    default: false,
  },
};

export const buildOptions: Record<string, yargs.Options> = {
  ...baseOptions,
  outDir: {
    type: 'string',
    describe: '输出文件夹',
    default: 'dist',
  },
};

export const watchOptions: Record<string, yargs.Options> = {
  ...baseOptions,
  hmr: {
    type: 'boolean',
    describe: '是否启用热更新',
    default: true,
  },
};
