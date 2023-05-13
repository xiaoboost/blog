import type { MochaOptions } from 'mocha';

import jss from 'jss';
import preset from 'jss-preset-default';

import { GlobalKey } from '@blog/context';

jss.setup(preset());

// 这里不使用 getGlobalContext 主要是要避免将 context/runtime 的其他内容全都引入
(globalThis as any)[GlobalKey.JSS] = jss;

export { expect, assert } from 'chai';
export { describe, it } from 'mocha';

export const mochaOptions: MochaOptions = {
  require: [require.resolve('tsm')],
  timeout: 4000,
  color: true,
};
