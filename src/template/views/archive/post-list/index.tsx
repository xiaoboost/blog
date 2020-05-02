import React from 'react';

import { Layout, LayoutProps } from 'src/template/components/layout';

interface Props extends LayoutProps {
    posts: Array<{
        title: string;
        url: string;
    }>;
}

export function Template(props: Props) {
    return (
        <Layout {...props}>
            posts
        </Layout>
    )
}
