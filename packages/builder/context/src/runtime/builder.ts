import type { BuilderOptions } from '@blog/types';
import { GlobalKey } from '../types';

export const builderOptions: Required<BuilderOptions> =
  globalThis[GlobalKey.Builder]?.options ?? {};
