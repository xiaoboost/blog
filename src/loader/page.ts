import * as path from 'path';
import * as fs from 'fs-extra';

import { StyleLoader } from './style';
import { ScriptLoader } from './script';
import { PostLoader } from './post';
import { BaseLoader, sources } from './base';

import { isArray } from 'src/utils/assert';

type PageCompute = (post: PostLoader) => any;
type MergeProps<P> = (posts: PostLoader[]) => P | P[];
type ReactComponent<P extends object> = (props: P) => JSX.Element;

export class PageLoader<P extends object> extends BaseLoader {
    /** 页面模板 */
    template: ReactComponent<P>;
    /** 文章数据监听 */
    compute: PageCompute;
    /** 组合 props */
    mergeProps: MergeProps<P>;
    /** 网页相关数据 */
    site = {
        style: '',
        script: '',
    };

    constructor(template: ReactComponent<P>, compute: PageCompute, mergeProps: MergeProps<P>) {
        super();
        this.compute = compute;
        this.template = template;
        this.mergeProps = mergeProps;
    }

    async init() {
        const [style, script] = await Promise.all([
            StyleLoader.Create(),
            ScriptLoader.Create(),
        ]);

        if (process.env.NODE_ENV === 'development') {
            style.observe(this, ({ output }) => output);
            script.observe(this, ({ output }) => output);
        }

        this.site = {
            style: style.output,
            script: script.output,
        };

        const posts = sources.filter((post) => post instanceof PostLoader) as PostLoader[];

        if (process.env.NODE_ENV === 'development') {
            posts.forEach((post) => {
                post.observe(this, this.compute);
            });
        }
    }

    async transform() {
        await this.init();

        const posts = sources.filter((post) => post instanceof PostLoader) as PostLoader[];
        const props = this.mergeProps(posts);

        if (isArray(props)) {

        }
        else {

        }
    }
}
