import React from 'react';

import { Layout } from 'src/template/components/layout';

interface Props {
    title: string;
    styleFile: string;
    scriptFile: string;
    posts: Array<{
        title: string;
        url: string;
    }>;
}

export function Template(props: Props) {
    return (
        <Layout
            styleFile={props.styleFile}
            scriptFile={props.scriptFile}
            title={props.title}
        >
            posts
        </Layout>
    )
}
