export * from './base';
export * from './image';
export * from './post';
export * from './style';
export * from './script';
export * from './copy';
export * from './page';

import * as fs from 'fs-extra';
import * as path from 'path';

import * as project from 'src/config/project';

import { sources } from './base';
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

// 生成首页
async function createIndex() {
    // ..
}

// 构建
(async function build() {
    await CopyLoader.Create([project.assetsPath]);
    await loadPosts();
})();
