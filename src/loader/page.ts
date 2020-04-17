import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { publicPath } from 'src/config/project';

import { StyleLoader } from './style';
import { ScriptLoader } from './script';
import { PostLoader } from './post';
import { BaseLoader, sources } from './base';

import { transArr } from 'src/utils/array';

type PageCompute = (post: PostLoader) => any;
type OmitSiteProps<P extends object> = Omit<P, 'publicPath' | 'styleFile' | 'scriptFile'> & { output: string };
type MergeProps<P extends object> = (posts: PostLoader[]) => OmitSiteProps<P> | OmitSiteProps<P>[];
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

    static async Create<P extends object>(template: ReactComponent<P>, compute: PageCompute, mergeProps: MergeProps<P>) {
        const loader = new PageLoader(template, compute, mergeProps);
        await loader._transform();
        return loader;
    }

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
        const props = transArr(this.mergeProps(posts));

        this.source = props.map(({ output, ...prop }) => ({
            path: output,
            data: renderToString(createElement(this.template, {
                ...prop,
                publicPath,
                styleFile: this.site.style,
                scriptFile: this.site.script,
            } as any)),
        }));
    }
}
