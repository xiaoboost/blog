import React from 'react';

import { markdown } from 'build/markdown';
import { Layout } from 'template/components/layout';

interface Props {
    /** 项目公共配置 */
    project: {
        publicPath: string;
        styleFile: string;
        scriptFile: string;
    },
    /** 文章内容 */
    post: {
        /** 当前文章标题 */
        title: string;
        /** 文章原内容 */
        content: string;
        /** 创建时间 */
        create: number;
        /** 最后更新时间 */
        update: number;
        /** 当前文章标签 */
        tags: string[];
        /** 插件列表 */
        plugins: string[];
    },
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
