import React from 'react';

import { Layout } from 'template/components/layout';

interface Props {
    publicPath: string;
    article: string;
}

export function Post({ publicPath, article }: Props) {
    return (
        <Layout publicPath={publicPath}>
            {article}
        </Layout>
    )
}
