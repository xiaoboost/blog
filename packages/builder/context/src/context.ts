import type { BuilderInstance } from '@blog/types';
import Jss from 'jss';
import preset from 'jss-preset-default';
import { GlobalKey } from './types';

Jss.setup(preset());

const Memory = new Map<string, any>();

/** 初始化全局上下文 */
export function initGlobalContext(builder: BuilderInstance) {
  return {
    [GlobalKey.Memory]: Memory,
    [GlobalKey.JSS]: Jss,
    [GlobalKey.Builder]: builder,
  };
}
