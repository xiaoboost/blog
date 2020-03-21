import { parse } from 'yaml';
import { normalize } from 'path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { Template as DefaultTemplate } from 'src/template/views/default';

import * as fs from 'fs-extra';
import * as util from '../utils/path';
import * as project from '../config/project';

/** 文章模板 */
enum PostTemplate {
    default,
}

/** 模板内容 */
const Templates = {
    [PostTemplate.default]: DefaultTemplate,
};

/** 文章属性 */
export interface PostData {
    title: string;
    date: number;
    update: number;
    content: string;
    tags: string[];
    plugins: string[];
    path: string;
    template: PostTemplate;
}

/** 文章数据 */
interface Post {
    title: string;
    date: number;
    update: number;
    tags: string[];
    html: string;
    path: string;
}

function readPost(path: string): PostData | undefined {
    const file = fs.readFileSync(path).toString();
    const result = file.match(/---([\d\D]+?)---([\d\D]*)/);

    if (!result) {
        return;
    }

    /** 读取的文章元数据 */
    interface PostMeta {
        /** 文章标题 */
        title: string;
        /** 文章创建时间 */
        date: string;
        /** 文章原文 */
        content: string;
        /** 文章标签 */
        tags?: string[];
        /** 文章最后更新时间 */
        update?: string;
        /** 文章模板 */
        template?: string;
        /** 文章启用的插件 */
        plugins?: string[];
        /** 禁用的插件 */
        disabledPlugins?: string[];
    }

    const [, metaStr, content] = result;
    const meta = parse(metaStr) as PostMeta;

    if (!meta) {
        return;
    }

    if (!meta.date) {
        throw new Error('文章必须要有 [date] 字段。');
    }

    const create = new Date(meta.date);
    const createTime = create.getTime();
    const updateTime = meta.update
        ? new Date(meta.update).getTime()
        : fs.statSync(path).mtimeMs;
    
    const defaultPlugins = ['goto-top', 'toc'];    
    // 插件列表
    let plugins: string[] = [];

    // 默认全部加载
    if (!meta.plugins && !meta.disabledPlugins) {
        plugins = defaultPlugins;
    }
    // 输入插件列表，则以此为准
    else if (meta.plugins) {
        plugins = meta.plugins.map((item) => item.trim().toLowerCase());
    }
    // 禁用插件列表，则取反
    else if (meta.disabledPlugins) {
        const disabled = meta.disabledPlugins.map((item) => item.trim().toLowerCase());
        plugins = defaultPlugins.filter((item) => !disabled.includes(item));
    }

    const template = PostTemplate[meta.template || PostTemplate[0]];

    if (typeof template !== 'number') {
        throw new Error(`模板名称错误：${meta.title}`);
    }

    const decodeTitle = meta.title.replace(/ /g, '-').toLowerCase();

    return {
        title: meta.title,
        date: createTime,
        update: updateTime,
        content: content.trim(),
        tags: meta.tags || [],
        path: normalize(`/posts/${create.getFullYear()}/${decodeTitle}/index.html`),
        template,
        plugins,
    }
}

function renderPost(post: PostData, pre?: PostData, next?: PostData): Post {
    const Template = Templates[post.template];
    const html = renderToString(createElement(Template, {
        project,
        post: {
            ...post,
            pre,
            next,
        },
    }));

    return {
        title: post.title,
        date: post.date,
        update: post.update,
        tags: post.tags,
        path: post.path,
        html,
    };
}

export function build() {
    return fs.readdir(util.resolve('posts')).then((list) => {
        return list
            .map((post) => readPost(util.resolve('posts', post, 'index.md')))
            .filter(<T>(post: T): post is NonNullable<T> => Boolean(post))
            .sort((pre, next) => pre.date > next.date ? 1 : -1)
            .map((item, i, arr) => renderPost(item, arr[i - 1], arr[i + 1]));
    });
}
