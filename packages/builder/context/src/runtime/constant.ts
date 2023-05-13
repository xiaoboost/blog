import type JSS from 'jss';
import type { BuilderInstance } from '@blog/types';

import { GlobalKey, Memory } from '../types';

export { GlobalKey } from '../types';

export interface GlobalContext {
  [GlobalKey.JSS]: typeof JSS;
  [GlobalKey.Memory]: Memory;
  [GlobalKey.Builder]: BuilderInstance;
}

export function getGlobalContext(): GlobalContext {
  return (globalThis ?? global) as any;
}
