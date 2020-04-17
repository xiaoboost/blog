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

import { Template as IndexTemplate } from 'src/template/views/index';

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

    })();

    // 生成标签文章列表页
    await (function createTagPosts() {

    })();

    // 生成年度文章列表页
    await (function createArchive() {

    })();
}

// 构建
(async function build() {
    await CopyLoader.Create([project.assetsPath]);
    await loadPosts();
    await createPage();
})();
