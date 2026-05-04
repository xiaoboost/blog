import type { MochaOptions } from 'mocha';

// 全局注入环境变量
(process.env as any).NODE_ENV = 'test';

export { expect, assert } from 'chai';
export { describe, it } from 'mocha';

export const mochaOptions: MochaOptions = {
  require: [require.resolve('tsx/cjs'), require.resolve('./mock-css.cjs')],
  timeout: 4000,
  color: true,
};
