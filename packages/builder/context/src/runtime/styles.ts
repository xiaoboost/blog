import { GlobalKey } from '../types';

/** Jss 构造器 */
export const jss = globalThis[GlobalKey.JSS];

/** jss 类型 */
export type { Styles, StyleSheet } from 'jss';
