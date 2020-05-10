import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { BaseLoader } from './base';
import { StyleLoader } from './style';
import { ScriptLoader } from './script';
import { PostLoader } from './post';
import { TemplateLoader } from './template';

import * as path from 'path';

import { toPinyin } from 'src/utils/string';
import { transArr, concat } from 'src/utils/array';
import { site, pageConfig } from 'src/config/site';
import { tagsPath, archivePath } from 'src/config/project';

import { Template as IndexTemplate } from 'src/template/views/index';
import { Template as TagsTemplate } from 'src/template/views/archive/tag-list';
import { Template as YearTemplate } from 'src/template/views/archive/year-list';
import { Template as PostListTemplate } from 'src/template/views/archive/post-list';

type OmitSiteProps<P extends object> = Omit<P, 'styleFile' | 'scriptFile'> & { output: string };
type MergeProps<P extends object> = (posts: PostLoader[]) => OmitSiteProps<P>[];
type ReactComponent<P extends object> = (props: P) => JSX.Element;

export class PageLoader<P extends object> extends BaseLoader {
    /** 类型 */
    type = 'page';
    /** 组合 props */
    mergeProps: MergeProps<P>;
    /** 页面模板文件 */
    templateFile: string;
    /** 页面模板 */
    template: ReactComponent<P> = () => '' as any;

    /** 其余相关数据 */
    attr = {
        style: '',
        script: '',
    };

    /** 生成聚合页 */
    static Create() {
        [
            createIndex(),
            createTagsList(),
            createTagPosts(),
            createArchives(),
            createArchivePosts(),
        ].forEach((page) => {
            page['_transform']();
            page.watch();
        });
    }

    constructor(template: string, mergeProps: MergeProps<P>) {
        super();
        this.templateFile = template;
        this.mergeProps = mergeProps;
    }

    async init() {
        const [style, script, template] = await Promise.all([
            StyleLoader.Create(),
            ScriptLoader.Create(),
            TemplateLoader.Create<(props: P) => JSX.Element>(this.templateFile),
        ]);

        style.addObserver(this.id, ({ output }) => output[0].path);
        script.addObserver(this.id, ({ output }) => output[0].path);
        template.addObserver(this.id, ({ template }) => template);

        this.template = template.template;

        this.attr = {
            style: style.output[0]?.path || '',
            script: script.output[0]?.path || '',
        };
    }

    async transform() {
        await this.init();

        const allSources = Object.values(BaseLoader.Sources);
        const posts = allSources
            .filter((item): item is PostLoader => item?.type === 'post')
            .filter((item) => item.public)
            .sort((pre, next) => pre.date < next.date ? 1 : -1);

        const props = transArr(this.mergeProps(posts));

        this.output = props.map(({ output, ...prop }) => ({
            path: output,
            data: renderToString(createElement(this.template, {
                ...prop,
                location: output,
                styleFile: this.attr.style,
                scriptFile: this.attr.script,
            } as any)),
        }));
    }

    watch() {
        BaseLoader.addObserver('posts', this.id, this.mergeProps);
    }
}

// 空标签属性
const spaceTag = {
    name: '（空）',
    url: '_space',
};

// 生成 tag 页路径
const getTagPath = (tagName: string) => {
    return `${tagsPath}/${tagName === spaceTag.name ? spaceTag.url : toPinyin(tagName)}/`;
};

// 生成归档页路径
const getArchivePath = (year: number | string) => {
    return `${archivePath}/${year}/`;;
};

// 生成首页
function createIndex() {
    const watchPost = (posts: PostLoader[]) => posts.map((post) => ({
        title: post.title,
        create: post.date,
        tags: post.tags,
        url: path.dirname(post.output[0]?.path || ''),
        description: post.description,
    }));

    const mergeProps = (posts: PostLoader[]) => {
        const postsData = watchPost(posts);
        const peerPost = pageConfig.index;
        const indexLength = Math.ceil(postsData.length / peerPost);

        return Array(indexLength).fill(true).map((_, i) => ({
            title: i === 0 ? site.title : `${site.title} | 第 ${i + 1} 页`,
            output: i === 0 ? 'index.html' : `page/${i + 1}/index.html`,
            pre: i === 0 ? null : i === 1 ? '' : `page/${i}/`,
            next: i === indexLength - 1 ? null : `page/${i + 1}/`,
            posts: postsData.slice(i * peerPost, (i + 1) * peerPost),
        }));
    };

    return new PageLoader<typeof IndexTemplate>('src/template/views/index/index.tsx', mergeProps);
}

// 生成标签聚合页
function createTagsList() {
    const watchPost = (posts: PostLoader[]) => {
        const map = {} as Record<string, number>;
        const tags = concat(posts.map(({ tags }) =>  tags), (tags) => tags.length === 0 ? [spaceTag.name] : tags);
        
        tags.forEach((name) => {
            if (map[name]) {
                map[name]++;
            }
            else {
                map[name] = 1;
            }
        });

        return Object.entries(map).map(([name, number]) => ({
            name, number,
        }));
    };
    const mergeProps = (posts: PostLoader[]) => {
        const tagSummary = watchPost(posts).map((tag) => ({
            ...tag,
            url: getTagPath(tag.name),
        }));

        return [{
            title: `标签 | ${site.title}`,
            output: `${tagsPath}/index.html`,
            tags: tagSummary.sort((pre, next) => {
                return pre.number > next.number ? -1 : 1;
            }),
        }];
    };

    return new PageLoader<typeof TagsTemplate>('src/template/views/archive/tag-list/index.tsx', mergeProps);
}

// 生成标签文章列表页
function createTagPosts() {
    const watchPost = (posts: PostLoader[]) => posts.map((post) => ({
        tags: post.tags,
        title: post.title,
        output: post.output[0]?.path || '',
    }));

    const mergeProps = (posts: PostLoader[]) => {
        const map = {} as Record<string, Array<{ title: string; output: string }>>;
        const postTags = watchPost(posts).map((data) => ({
            ...data,
            tags: data.tags.length === 0 ? [spaceTag.name] : data.tags,
        }));
        
        postTags.forEach(({ tags, output, title }) => {
            tags.forEach((tag) => {
                if (map[tag]) {
                    map[tag].push({ title, output });
                }
                else {
                    map[tag] = [{ title, output }];
                }
            });
        });

        return Object.entries(map).map(([title, posts]) => ({
            title,
            output: `${getTagPath(title)}index.html`,
            posts: posts.map(({ title, output: url }) => ({
                title, url,
            })),
        }));
    };

    return new PageLoader<typeof PostListTemplate>('src/template/views/archive/post-list/index.tsx', mergeProps);
}

// 生成归档列表页
function createArchives() {
    const mergeProps = (posts: PostLoader[]) => {
        const map = {} as Record<number, number>;
        
        posts.forEach(({ date }) => {
            const year = new Date(date).getFullYear();

            if (map[year]) {
                map[year]++;
            }
            else {
                map[year] = 1;
            }
        });
        
        const yearSummary = Object.entries(map).map(([name, number]) => ({
            number,
            year: String(name),
            url: getTagPath(name),
        }));

        return [{
            title: `归档 | ${site.title}`,
            output: `${archivePath}/index.html`,
            years: yearSummary.sort((pre, next) => {
                return pre.year > next.year ? -1 : 1;
            }),
        }];
    };

    return new PageLoader<typeof YearTemplate>('src/template/views/archive/year-list/index.tsx', mergeProps);
}

// 生成归档文章列表页
function createArchivePosts() {
    const watchPost = (posts: PostLoader[]) => posts.map((post: PostLoader) => ({
        date: post.date,
        title: post.title,
        output: post.output[0]?.path || '',
    }));

    const mergeProps = (posts: PostLoader[]) => {
        const map = {} as Record<number, Array<{ title: string; output: string }>>;
        const postTags = watchPost(posts);
        
        postTags.forEach(({ date, output, title }) => {
            const year = new Date(date).getFullYear();

            if (map[year]) {
                map[year].push({ title, output });
            }
            else {
                map[year] = [{ title, output }];
            }
        });

        return Object.entries(map).map(([year, posts]) => ({
            title: `归档 ${year} 年`,
            output: `${getArchivePath(year)}index.html`,
            posts: posts.map(({ title, output: url }) => ({
                title, url,
            })),
        }));
    };

    return new PageLoader<typeof PostListTemplate>('src/template/views/archive/post-list/index.tsx', mergeProps);
}
