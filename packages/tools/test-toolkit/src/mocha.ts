import type { MochaOptions } from 'mocha';

// 全局注入环境变量
(process.env as any).NODE_ENV = 'test';

export { expect, assert } from 'chai';
export { describe, it } from 'mocha';

export const mochaOptions: MochaOptions = {
  // 同时处理 import 和 require，避免 Node 24 绕过 tsx 用原生方式加载 TS。
  require: [require.resolve('tsx')],
  timeout: 4000,
  color: true,
};
