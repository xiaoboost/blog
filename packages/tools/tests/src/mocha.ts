import type { MochaOptions } from 'mocha';

import jss from 'jss';
import preset from 'jss-preset-default';

jss.setup(preset());

(globalThis as any).jss = jss;

export { expect, assert } from 'chai';

export const mochaOptions: MochaOptions = {
  require: [require.resolve('tsx')],
  timeout: 4000,
  color: true,
};
