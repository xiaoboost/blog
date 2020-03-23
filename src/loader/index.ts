import * as fs from 'fs-extra';
import * as path from 'path';

import { PostItem } from './post';
import { BaseItem, sources } from './base';

import { resolveRoot } from 'src/utils/path';

const postsDir = resolveRoot('posts');

/** 初始化 */
export const loaded = (async () => {
    const postNames = await fs.readdir(postsDir);
    const posts = await Promise.all(postNames.map((dir) => PostItem.Create(path.join(postsDir, dir, 'index.md'))));

    if (process.env.NODE_ENV === 'development') {
        posts.forEach((post) => post.watch());
    }

    await Promise.all(sources.map((item) => item.write()));
})();
