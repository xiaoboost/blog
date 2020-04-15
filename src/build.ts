// 生产模式
process.env.NODE_ENV = 'production';

import * as fs from 'fs-extra';
import * as path from 'path';

import * as loader from './loader';

import { postsDir } from 'src/config/project';

async function loadPosts() {
    const postNames = await fs.readdir(postsDir);
    const posts: loader.PostLoader[] = [];

    // 读取所有文章
    for (let i = 0; i < postNames.length; i++) {
        const postName = postNames[i];
        const postPath = path.join(postsDir, postName, 'index.md');

        if (!(await fs.pathExists(postPath))) {
            continue;
        }

        posts.push(await loader.PostLoader.Create(postPath));
    }

    /** 时间从近至远排序 */
    return posts.sort((pre, next) => pre.date < next.date ? 1 : -1);
}

/** 构建 */
(async function build() {
    // 复制静态资源
    await loader.CopyLoader.Create(['src/template/assets']);
    // 读取文章
    await loadPosts();
    // 生成聚合页
})();
