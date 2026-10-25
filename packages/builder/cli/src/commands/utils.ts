import type yargs from 'yargs';

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
    default: 'Info',
    choices: ['Debug', 'Info', 'Error'],
  },
  debug: {
    type: 'boolean',
    describe: '收集并打印构建与插件耗时',
    default: false,
  },
  reportFile: {
    type: 'string',
    describe: '调试报告的 Markdown 输出路径（仅 --debug 时生效）',
    requiresArg: true,
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
  port: {
    type: 'number',
    describe: '开发服务器端口号',
    default: 7777,
  },
};
