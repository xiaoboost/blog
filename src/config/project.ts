import { resolveRoot } from '../utils/path';

/** 项目输出文件路径 */
export const buildOutput = resolveRoot('dist');
/** 文章路径 */
export const postsDir = resolveRoot('posts');

/** 网站资源公共路径 */
export const publicPath = '/';

/** 标签页路径 */
export const tagsPath = 'tag';
/** 归档页路径 */
export const archivePath = 'archive';

/** 全局模板文件夹 */
export const templatePath = resolveRoot('src/template');
/** 全局资源文件文件夹 */
export const assetsPath = resolveRoot('src/template/assets');
/** 插件路径 */
export const pluginPath = resolveRoot('src/template/plugins');
