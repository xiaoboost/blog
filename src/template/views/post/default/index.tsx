import React from 'react';

import { Layout } from 'src/template/components/layout';
import { PostData } from 'src/loader/post';

/** 项目公共配置 */
interface ProjectEv {
    publicPath: string;
    styleFile: string;
    scriptFile: string;
}

interface Props {
    project: ProjectEv;
    post: PostData;
}

export function Template({ project, post }: Props) {
    return (
        <Layout {...{
            ...project,
            title: post.title,
        }}>
            <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </Layout>
    )
}
