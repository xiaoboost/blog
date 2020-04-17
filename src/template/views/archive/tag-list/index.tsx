import React from 'react';

import { Layout } from 'src/template/components/layout';

interface Props {
    title: string;
    publicPath: string;
    styleFile: string;
    scriptFile: string;
    tags: Array<{
        name: string;
        url: string;
        number: number;
    }>;
}

export function Template(props: Props) {
    return (
        <Layout
            publicPath={props.publicPath}
            styleFile={props.styleFile}
            scriptFile={props.scriptFile}
            title={props.title}
        >
            tags
        </Layout>
    )
}
