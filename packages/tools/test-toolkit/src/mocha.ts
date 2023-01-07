import type { MochaOptions } from 'mocha';

import jss from 'jss';
import preset from 'jss-preset-default';

import { GlobalKey } from '@blog/context';

jss.setup(preset());

globalThis[GlobalKey.JSS] = jss;

export { expect, assert } from 'chai';
export { describe, it } from 'mocha';

export const mochaOptions: MochaOptions = {
  require: [require.resolve('tsx')],
  timeout: 4000,
  color: true,
};
