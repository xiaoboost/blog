import { resolve } from '../build/utils';

/** 项目输出文件路径 */
export const buildOutput = resolve('dist');

/** 网站资源公共路径 */
export const publicPath = '/';
/** 全局引用样式文件 */
export const styleFile = 'css/style.css';
/** 全局引用脚本文件 */
export const scriptFile = 'js/script.js';

/** 全局资源文件文件夹 */
export const assetsPath = resolve('template/assets');
/** 全局 css 入口文件 */
export const styleEntryFile = resolve('template/styles/index.less');
/** 全局 css 入口文件 */
export const scriptEntryFile = resolve('template/plugins/index.ts');
