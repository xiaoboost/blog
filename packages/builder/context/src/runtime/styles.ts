import { getGlobalContext, GlobalKey } from './constant';

/** Jss 构造器 */
export const jss = getGlobalContext()[GlobalKey.JSS];

/** jss 类型 */
export type { Styles, StyleSheet } from 'jss';
