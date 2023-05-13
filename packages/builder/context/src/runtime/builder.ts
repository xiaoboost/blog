import type { BuilderOptions } from '@blog/types';
import { getGlobalContext, GlobalKey } from './constant';

export const builderOptions: Required<BuilderOptions> =
  getGlobalContext()[GlobalKey.Builder]?.options ?? {};
