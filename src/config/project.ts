import { resolveRoot } from '../utils/path';

/** 项目输出文件路径 */
export const buildOutput = resolveRoot('dist');

/** 网站资源公共路径 */
export const publicPath = '/';
/** 全局引用样式文件 */
export const styleFile = 'css/style.css';
/** 全局引用脚本文件 */
export const scriptFile = 'js/script.js';

/** 全局资源文件文件夹 */
export const assetsPath = resolveRoot('src/template/assets');
/** 插件路径 */
export const pluginPath = resolveRoot('src/template/plugins');
