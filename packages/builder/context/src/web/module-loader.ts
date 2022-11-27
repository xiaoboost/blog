import type { ModuleLoader as ModuleLoaderInstance } from '@blog/types';
import { GlobalKey } from '../types';

export const ModuleLoader: ModuleLoaderInstance = window[GlobalKey.ModuleLoader];
