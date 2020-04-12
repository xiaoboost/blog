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

        const post = await loader.PostLoader.Create(postPath);

        if (process.env.NODE_ENV !== 'production') {
            post.watch();
        }

        posts.push(post);
    }

    return posts;
}

/** 初始化 */
// export const loaded = (async () => {
//     const postNames = await fs.readdir(postsDir);
//     const posts: PostLoader[] = [];

//     // 读取所有文章
//     for (let i = 0; i < postNames.length; i++) {
//         const postName = postNames[i];
//         const postPath = path.join(postsDir, postName, 'index.md');
//         const post = await PostLoader.Create(postPath);

//         if (process.env.NODE_ENV !== 'production') {
//             post.watch();
//         }

//         posts.push(post);
//     }

//     await Promise.all(sources.map((item) => item.write()));
// })();
