import React from 'react';

import { markdown } from 'build/renderer/markdown';
import { Layout } from 'template/components/layout';

/** 项目公共配置 */
interface ProjectEv {
    publicPath: string;
    styleFile: string;
    scriptFile: string;
}

/** 文章数据 */
interface PostData {
    /** 当前文章标题 */
    title: string;
    /** 文章原内容 */
    content: string;
    /** 创建时间 */
    date: number;
    /** 最后更新时间 */
    update: number;
    /** 当前文章标签 */
    tags: string[];
    /** 插件列表 */
    plugins: string[];
    /** 上一篇文章 */
    pre?: PostData;
    /** 下一篇文章 */
    next?: PostData;
}

interface Props {
    project: ProjectEv;
    post: PostData;
}

export function Template({ project, post }: Props) {
    const content = markdown.render(post.content);
    const tokens = markdown.parse(post.content, {});

    return (
        <Layout {...{
            ...project,
            title: post.title,
        }}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </Layout>
    )
}
