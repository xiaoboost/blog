import { parse } from 'yaml';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { markdown } from './markdown';

import { Template as DefaultTemplate } from 'template/views/default';

import * as fs from 'fs';
import * as config from './config';

/** 文章模板 */
enum PostTemplate {
    default,
}

/** 模板内容 */
const templates = {
    [PostTemplate.default]: DefaultTemplate,
};

interface PostMeta {
    /** 文章标题 */
    title: string;
    /** 文章创建时间 */
    create: string;
    /** 文章类别 */
    category?: string;
    /** 文章标签 */
    tags?: string[];
    /** 文章最后更新时间 */
    update?: string;
    /** 文章启用的插件 */
    plugins?: string[];
    /** 文章模板 */
    template?: string;
}

interface Post {
    title: string;
    create: number;
    update: number;
    category: string;
    tags: string[];
    html: string;
    path: string;
}

export function renderPost(path: string): Post | undefined {
    const file = fs.readFileSync(path).toString();
    const result = file.match(/---([\d\D]+?)---([\d\D]*)/);

    if (!result) {
        return;
    }

    const [, metaStr, contentStr] = result;
    const meta = parse(metaStr) as PostMeta;

    if (!meta) {
        return;
    }

    const update = meta.update
        ? new Date(meta.update).getTime()
        : fs.statSync(path).mtimeMs;

    const templateName = meta.template || PostTemplate[0];
    const Template = templates[PostTemplate[templateName] as PostTemplate];
    const html = renderToString(createElement(Template, {
        ...config,
        content: markdown.render(contentStr.trim()).trim(),
    }));

    return {
        title: meta.title,
        create: new Date(meta.create).getTime(),
        category: meta.category || '未分类',
        tags: meta.tags || [],
        update,
        html,
        path,
    };
}
