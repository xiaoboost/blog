import React from 'react';

import { Layout } from 'src/template/components/layout';

interface Props {
    public: string;
    title: string;
    styleFile: string;
    scriptFile: string;
    next: string | null;
    pre: string | null;
    posts: Array<{
        title: string;
        url: string;
        tags: string[];
        create: number;
    }>;
}

export function Template(props: Props) {
    return (
        <Layout
            publicPath={props.public}
            styleFile={props.styleFile}
            scriptFile={props.scriptFile}
            title={props.title}
        >
            内容
        </Layout>
    )
}
