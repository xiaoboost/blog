import type { ModuleLoader } from '@blog/types';

import type { GlobalKey } from '../types';

export { GlobalKey } from '../types';

export interface GlobalContext {
  [GlobalKey.ModuleLoader]: ModuleLoader;
}

export function getGlobalContext(): GlobalContext {
  return (globalThis ?? window) as any;
}
