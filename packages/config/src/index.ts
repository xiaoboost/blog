import { isDevelopment } from '@blog/utils';

/** 网站简介 */
export const site = {
  title: 'Dreaming Cat\'s',
  author: 'xiao',
  cname: 'www.dreamingcat.me',
  description: 'xiao 的个人博客',
  github: 'https://github.com/xiaoboost',
};

/** 链接 */
export const links = {
  电路仿真: 'https://xiaoboost.github.io/circuit-simulator/',
};

/** 网站配置 */
export const pageConfig = {
  index: 10,
  archive: 30,
};

/** 项目输出文件路径 */
export const outputDir = 'dist';
/** 公共资源公共路径 */
export const publicPath = '/';
/** 静态资源路径 */
export const assetNames = isDevelopment ? 'assets/[name]' : 'assets/[name].[hash]';
/** 标签页路径 */
export const tagsPath = 'tag';
/** 归档页路径 */
export const archivePath = 'archive';
/** 本地调试时的端口号 */
export const devPort = 6060;
