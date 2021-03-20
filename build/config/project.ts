import { resolveRoot } from '../utils/path';

/** 项目输出文件路径 */
export const outputDir = resolveRoot('dist');
/** 文章路径 */
export const postsDir = resolveRoot('posts');

/** 网站资源公共路径 */
export const publicPath = '/';
/** 项目静态资源路径 */
export const assetsPath = 'assets';
/** 标签页路径 */
export const tagsPath = 'tag';
/** 归档页路径 */
export const archivePath = 'archive';
/** 本地调试时的端口号 */
export const devPort = 6060;
