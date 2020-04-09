import * as fs from 'fs-extra';
import * as path from 'path';

import { PostItem } from './post';
import { sources } from './base';

import { postsDir } from 'src/config/project';

export * from './base';
export * from './image';
export * from './post';
export * from './style';
export * from './script';

/** 初始化 */
export const loaded = (async () => {
    const postNames = await fs.readdir(postsDir);
    const posts: PostItem[] = [];

    // 读取所有文章
    for (let i = 0; i < postNames.length; i++) {
        const postName = postNames[i];
        const postPath = path.join(postsDir, postName, 'index.md');
        const post = await PostItem.Create(postPath);

        if (process.env.NODE_ENV !== 'production') {
            post.watch();
        }

        posts.push(post);
    }

    await Promise.all(sources.map((item) => item.write()));
})();
