import React from 'react';

import { Layout } from 'template/components/layout';

interface Props {
    publicPath: string;
    content: string;
}

export function Template({ publicPath, content }: Props) {
    return (
        <Layout publicPath={publicPath}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </Layout>
    )
}
