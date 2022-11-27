import Jss from 'jss';
import preset from 'jss-preset-default';

import type { BuilderInstance } from '@blog/types';

import { GlobalKey } from './types';
import { Memory } from './accessor';

Jss.setup(preset());

/** 运行器上下文 */
export function getContext(builder: BuilderInstance) {
  return {
    [GlobalKey.Memory]: Memory,
    [GlobalKey.JSS]: Jss,
    [GlobalKey.Builder]: builder,
  };
}
