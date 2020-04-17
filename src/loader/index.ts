export * from './base';
export * from './image';
export * from './post';
export * from './style';
export * from './script';
export * from './copy';
export * from './page';

import * as fs from 'fs-extra';
import * as path from 'path';

import * as site from 'src/config/site';
import * as project from 'src/config/project';

import { PostLoader } from './post';
import { CopyLoader } from './copy';
import { PageLoader } from './page';

import { concat } from 'src/utils/array';
import { toPinyin } from 'src/utils/string';

import { Template as IndexTemplate } from 'src/template/views/index';
import { Template as TagsTemplate } from 'src/template/views/archive/tag-list';
import { Template as YearTemplate } from 'src/template/views/archive/year-list';
import { Template as PostListTemplate } from 'src/template/views/archive/post-list';

// 读取所有文章
async function loadPosts() {
    const postNames = await fs.readdir(project.postsDir);
    const posts: PostLoader[] = [];

    // 读取所有文章
    for (let i = 0; i < postNames.length; i++) {
        const postName = postNames[i];
        const postPath = path.join(project.postsDir, postName, 'index.md');

        if (!(await fs.pathExists(postPath))) {
            continue;
        }

        posts.push(await PostLoader.Create(postPath));
    }

    /** 时间从近至远排序 */
    return posts.sort((pre, next) => pre.date < next.date ? 1 : -1);
}

// 生成聚合页
async function createPage() {
    // 空标签属性
    const spaceTag = {
        name: '（空）',
        url: '_space',
    };

    // 生成 tag 页路径
    const tagPath = (tagName: string) => {
        return `${project.tagsPath}/${tagName === spaceTag.name ? spaceTag.url : toPinyin(tagName)}/`;
    };

    // 生成归档页路径
    const archivePath = (year: number | string) => {
        return `${project.archivePath}/${year}/`;;
    };

    // 生成首页
    await (function createIndex() {
        const watchPost = (post: PostLoader) => ({
            title: post.title,
            create: post.date,
            tags: post.tags,
            url: path.dirname(post.output),
            description: post.content.trim().slice(0, 200),
        });

        const mergeProps = (posts: PostLoader[]) => {
            const postsData = posts.map(watchPost);
            const peerPost = site.pageConfig.index;
            const indexLength = Math.ceil(postsData.length / peerPost);

            return Array(indexLength).fill(true).map((_, i) => ({
                title: i === 0 ? site.site.title : `${site.site.title} | 第 ${i + 1} 页`,
                output: i === 0 ? 'index.html' : `page/${i + 1}/index.html`,
                pre: i === 0 ? null : i === 1 ? '' : `page/${i}/`,
                next: i === indexLength - 1 ? null : `page/${i + 1}/`,
                posts: postsData.slice(i * peerPost, (i + 1) * peerPost),
            }));
        };

        return PageLoader.Create(IndexTemplate, watchPost, mergeProps);
    })();

    // 生成标签聚合页
    await (function createTagsList() {
        const watchPost = ({ tags }: PostLoader) => tags;
        const mergeProps = (posts: PostLoader[]) => {
            const map = {} as Record<string, number>;
            const tags = concat(posts.map(watchPost), (arr) => arr.length === 0 ? [spaceTag.name] : arr);
            
            tags.forEach((name) => {
                if (map[name]) {
                    map[name]++;
                }
                else {
                    map[name] = 1;
                }
            });

            const tagSummary = Object.entries(map).map(([name, number]) => ({
                name, number,
                url: tagPath(name),
            }));

            return {
                title: `${site.site.title} | 标签页`,
                output: `${project.tagsPath}/index.html`,
                tags: tagSummary,
            };
        };

        return PageLoader.Create(TagsTemplate, watchPost, mergeProps);
    })();

    // 生成标签文章列表页
    await (function createTagPosts() {
        const watchPost = (post: PostLoader) => ({
            tags: post.tags,
            title: post.title,
            output: post.output,
        });

        const mergeProps = (posts: PostLoader[]) => {
            const map = {} as Record<string, Pick<PostLoader, 'title' | 'output'>[]>;
            const postTags = posts.map(watchPost).map((data) => ({
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
                output: `${tagPath(title)}index.html`,
                posts: posts.map(({ title, output: url }) => ({
                    title, url,
                })),
            }));
        };

        return PageLoader.Create(PostListTemplate, watchPost, mergeProps);
    })();

    // 生成归档列表页
    await (function createArchives() {
        const watchPost = ({ date }: PostLoader) => date;
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
                url: tagPath(name),
            }));

            return {
                title: `${site.site.title} | 归档`,
                output: `${project.archivePath}/index.html`,
                years: yearSummary,
            };
        };

        return PageLoader.Create(YearTemplate, watchPost, mergeProps);
    })();

    // 生成归档文章列表页
    await (function createArchivePosts() {
        const watchPost = (post: PostLoader) => ({
            date: post.date,
            title: post.title,
            output: post.output,
        });

        const mergeProps = (posts: PostLoader[]) => {
            const map = {} as Record<number, Pick<PostLoader, 'title' | 'output'>[]>;
            const postTags = posts.map(watchPost);
            
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
                output: `${archivePath(year)}index.html`,
                posts: posts.map(({ title, output: url }) => ({
                    title, url,
                })),
            }));
        };

        return PageLoader.Create(PostListTemplate, watchPost, mergeProps);
    })();
}

// 构建
(async function build() {
    await CopyLoader.Create([project.assetsPath]);
    await loadPosts();
    await createPage();
})();
