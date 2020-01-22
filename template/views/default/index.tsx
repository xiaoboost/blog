import React from 'react';

import { Layout } from 'template/components/layout';

interface Props {
    /** 项目公共配置 */
    project: {
        publicPath: string;
        stylePath: string;
        scriptPath: string;
    },

    /** 当前文章标题 */
    title: string;
    /** 文章内容 */
    content: string;
    /** 创建时间 */
    create: number;
    /** 最后更新时间 */
    update: number;
}

export function Template({ project, ...post }: Props) {
    return (
        <Layout {...{
            ...project,
            title: post.title,
        }}>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </Layout>
    )
}
