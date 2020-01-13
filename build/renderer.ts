import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import * as fs from 'fs-extra';
import * as util from './utils';
import * as config from './config';

import { Post } from 'template/views/post';

interface PostMeta {
    /** 文章标题 */
    title: string;
    /** 文章创建时间 */
    create: string;
    /** 文章最后更新时间 */
    update: string;
    /** 文章模板 */
    template: string;
    /** TODO: 是否启用评论 */
    comments: boolean;
    /** 文章标签 */
    tags: string[];
    /** 文章类别 */
    category: string;
    /** 文章启用的插件 */
    plugins: string[];

    /** 文章原始内容 */
    originContent: string;
    /** 渲染后的内容 */
    rendered: string;
}

function fixHtml(content: string) {
    return '<!DOCTYPE html>' + content;
}

export async function render() {
    const content = fixHtml(renderToString(createElement(Post, {
        ...config,
        content: '文章内容',
    })));

    console.log(content);
    debugger;
}
