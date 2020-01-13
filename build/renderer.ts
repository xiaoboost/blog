import { renderPost } from './post';

import * as fs from 'fs';
import * as util from './utils';

export async function render() {
    const posts = fs.readdirSync(util.resolve('posts'))
        .map((post) => renderPost(util.resolve('posts', post, 'index.md')))
        .filter(<T>(post: T): post is NonNullable<T> => Boolean(post));

    console.log(posts);
    debugger;
}
