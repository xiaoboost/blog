import { parse } from 'yaml';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { Template as DefaultTemplate } from 'template/views/default';

import * as fs from 'fs';
import * as project from '../config/project';

/** 文章模板 */
enum PostTemplate {
    default,
}

/** 模板内容 */
const templates = {
    [PostTemplate.default]: DefaultTemplate,
};

/** 文章元数据 */
interface PostMeta {
    /** 文章标题 */
    title: string;
    /** 文章创建时间 */
    create: string;
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

/** 文章数据 */
interface Post {
    title: string;
    create: number;
    update: number;
    tags: string[];
    html: string;
    path: string;
}

const defaultPlugins = ['goto-top', 'toc'];

export function renderPost(path: string): Post | undefined {
    const file = fs.readFileSync(path).toString();
    const result = file.match(/---([\d\D]+?)---([\d\D]*)/);

    if (!result) {
        return;
    }

    const [, metaStr, content] = result;
    const meta = parse(metaStr) as PostMeta;

    if (!meta) {
        return;
    }

    const createTime = new Date(meta.create).getTime();
    const updateTime = meta.update
        ? new Date(meta.update).getTime()
        : fs.statSync(path).mtimeMs;
    
    // 插件列表
    let postPlugins: string[] = [];
    // 默认全部加载
    if (!meta.plugins && !meta.disabledPlugins) {
        postPlugins = defaultPlugins;
    }
    // 输入插件列表，则以此为准
    else if (meta.plugins) {
        postPlugins = meta.plugins.map((item) => item.trim().toLowerCase());
    }
    // 禁用插件列表，则取反
    else if (meta.disabledPlugins) {
        const disabled = meta.disabledPlugins.map((item) => item.trim().toLowerCase());
        postPlugins = defaultPlugins.filter((item) => !disabled.includes(item));
    }

    const templateName = meta.template || PostTemplate[0];
    const Template = templates[PostTemplate[templateName] as PostTemplate];
    const html = renderToString(createElement(Template, {
        project,
        post: {
            title: meta.title,
            content: content.trim(),
            create: createTime,
            update: updateTime,
            plugins: postPlugins,
            tags: meta.tags || [],
        },
    }));

    return {
        title: meta.title,
        create: createTime,
        update: updateTime,
        tags: meta.tags || [],
        html,
        path,
    };
}
