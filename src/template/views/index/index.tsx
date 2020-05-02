import React from 'react';

import { Layout, LayoutProps } from 'src/template/components/layout';

interface Props extends LayoutProps {
    next: string | null;
    pre: string | null;
    posts: Array<{
        title: string;
        url: string;
        tags: string[];
        create: number;
        description: string;
    }>;
}

export function Template(props: Props) {
    return (
        <Layout {...props}>
            index
        </Layout>
    )
}
