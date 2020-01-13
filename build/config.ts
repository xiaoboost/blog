import * as utils from './utils';

/** 项目输出文件路径 */
export const buildOutput = utils.resolve('dist');
/** 网站资源公共路径 */
export const publicPath = '/';
/** 网站地址 */
export const website = 'www.dreamingcat.me';
/** 网站简介 */
export const site = {
    title: 'Dreaming Cat\'s',
    subtitle: '梦之上',
    description: '闲言碎语',
};
/** 作者信息 */
export const author = {
    name: 'xiaoboost',
    contact: {
        email: 'xiaoboost@qq.com',
        github: 'https://github.com/xiaoboost',
    },
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
