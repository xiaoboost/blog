import Token from 'markdown-it/lib/token';

import * as fs from 'fs-extra';
import * as path from 'path';

import * as project from 'src/config/project';

import { parse } from 'yaml';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { BaseItem } from './base';
import { ImageItem } from './image';
import { Markdown } from 'src/renderer/markdown';

import { isArray } from 'src/utils/assert';
import { normalize } from 'src/utils/path';

import { Template as DefaultTemplate } from 'src/template/views/default';

/** 文章模板 */
enum PostTemplate {
    default,
}

/** 模板内容 */
const Templates = {
    [PostTemplate.default]: DefaultTemplate,
};

/** 文章原始元数据 */
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

/** 文章元数据 */
export interface PostData {
    title: string;
    date: number;
    update: number;
    tags: string[];
    html: string;
    content: string;
    template: PostTemplate;
    tokens: Token[];
    plugins: string[];
}

/** 默认插件 */
const defaultPlugins = ['goto-top', 'toc']; 

export class PostItem extends BaseItem implements PostData {
    /** 文章标题 */
    title = '';
    /** 文章创建日期 */
    date = -1;
    /** 文章更新日期 */
    update = -1;
    /** 文章标签内容 */
    tags: string[] = [];
    /** 文章编译后的 html 源码 */
    html = '';
    /** 文章原始内容 */
    content = '';
    /** 文章编译的模板 */
    template = PostTemplate.default;
    /** 文章编译后的 tokens 列表 */
    tokens: Token[] = [];
    /** 文章所使用的插件列表 */
    plugins: string[] = [];

    /** 创建文章 */
    static async Create(from: string) {
        const post = new PostItem(from);

        await post.readMeta();
        await post.setBuildTo();
        await post.transform();

        return post;
    }

    private errorHandler(msg: string) {
        this.html = msg;
        throw new Error(msg);
    }

    private async readMeta() {
        const origin = this.origin = await fs.readFile(this.from);
        const result = origin.toString().match(/^---([\d\D]+?)---([\d\D]*)$/);

        if (!result) {
            this.errorHandler('文件格式错误');
            return;
        }

        const [, metaStr, content] = result;
        const meta = parse(metaStr) as PostMeta;

        if (!meta) {
            return;
        }

        if (!meta.date) {
            this.errorHandler('文章必须要有 [date] 字段');
            return;
        }

        this.content = content.trim();
        this.tags = meta.tags || [];
        this.title = meta.title;
        this.date = new Date(meta.date).getTime();
        this.update = meta.update
            ? new Date(meta.update).getTime()
            : (await fs.stat(this.from)).mtimeMs;

        // 默认全部加载
        if (!meta.plugins && !meta.disabledPlugins) {
            this.plugins = defaultPlugins;
        }
        // 输入插件列表，则以此为准
        else if (meta.plugins) {
            this.plugins = meta.plugins.map((item) => item.trim().toLowerCase());
        }
        // 禁用插件列表，则取反
        else if (meta.disabledPlugins) {
            const disabled = meta.disabledPlugins.map((item) => item.trim().toLowerCase());
            this.plugins = defaultPlugins.filter((item) => !disabled.includes(item));
        }

        this.template = PostTemplate[meta.template || PostTemplate[0]];

        if (typeof this.template !== 'number') {
            this.errorHandler(`模板名称错误：${meta.title}`);
            return;
        }
    }

    private async setBuildTo() {
        const create = new Date(this.date);
        const dirName = path.basename(path.dirname(this.from));
        const decodeTitle = dirName.replace(/ /g, '-').toLowerCase();

        this.buildTo = path.normalize(`/posts/${create.getFullYear()}/${decodeTitle}/index.html`);
    }

    private async resetToken(token: Token | Token[]) {
        if (isArray(token)) {
            await Promise.all(token.map(this.resetToken.bind(this)));
            return;
        }

        const dirpath = path.dirname(this.from);

        switch (token.type) {
            case 'image': {
                const imageRef = normalize(dirpath, token.attrGet('src') || '');

                if (!imageRef) {
                    break;
                }

                const image = await ImageItem.Create(imageRef);

                token.attrSet('src', image.buildTo);

                break;
            }
        }

        if (token.children?.length > 0) {
            await this.resetToken(token.children);
        }
    }

    private async transform() {
        this.tokens = Markdown.parse(this.content, {});
        // 异步等待
        await this.resetToken(this.tokens);
        // 重新编译
        this.html = Markdown.renderer.render(this.tokens, {}, {});

        const Template = Templates[this.template];
        const html = renderToString(createElement(Template, {
            project,
            post: this,
        }));

        this.source = Buffer.from(`<!DOCTYPE html>${html}`);
    }
}
