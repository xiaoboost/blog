import type { BuilderInstance, BuildHook } from '@blog/types';

import type { GlobalKey, Memory } from '../types';

export { GlobalKey } from '../types';

export interface GlobalContext {
  [GlobalKey.Memory]: Memory;
  [GlobalKey.Builder]: BuilderInstance;
  [GlobalKey.RuntimeCallbacks]: BuildHook[];
}

export function getGlobalContext(): GlobalContext {
  return (globalThis ?? global) as any;
}
