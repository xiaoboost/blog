import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { publicPath } from 'src/config/project';

import { StyleLoader } from './style';
import { ScriptLoader } from './script';
import { PostLoader } from './post';
import { TemplateLoader } from './template';
import { BaseLoader, sources } from './base';

import { transArr } from 'src/utils/array';

type PageCompute = (post: PostLoader) => any;
type OmitSiteProps<P extends object> = Omit<P, 'publicPath' | 'styleFile' | 'scriptFile'> & { output: string };
type MergeProps<P extends object> = (posts: PostLoader[]) => OmitSiteProps<P> | OmitSiteProps<P>[];
type ReactComponent<P extends object> = (props: P) => JSX.Element;

export class PageLoader<P extends object> extends BaseLoader {
    /** 页面模板 */
    template!: ReactComponent<P>;
    /** 页面模板 */
    templatePath: string;
    /** 文章数据监听 */
    compute: PageCompute;
    /** 组合 props */
    mergeProps: MergeProps<P>;
    /** 网页相关数据 */
    site = {
        style: '',
        script: '',
    };

    static async Create<P extends object>(template: string, compute: PageCompute, mergeProps: MergeProps<P>) {
        const loader = new PageLoader(template, compute, mergeProps);
        await loader._transform();
        return loader;
    }

    constructor(template: string, compute: PageCompute, mergeProps: MergeProps<P>) {
        super();
        this.compute = compute;
        this.templatePath = template;
        this.mergeProps = mergeProps;
    }

    async init() {
        const [style, script, template] = await Promise.all([
            StyleLoader.Create(),
            ScriptLoader.Create(),
            TemplateLoader.Create<(props: P) => JSX.Element>(this.templatePath),
        ]);

        if (process.env.NODE_ENV === 'development') {
            this.observe(style, ({ output }) => output);
            this.observe(script, ({ output }) => output);
            this.observe(template, ({ template }) => template);
        }

        this.template = template.template;

        this.site = {
            style: style.output,
            script: script.output,
        };

        const posts = sources.filter((post) => post instanceof PostLoader) as PostLoader[];

        if (process.env.NODE_ENV === 'development') {
            posts.forEach((post) => {
                this.observe(post, this.compute);
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
