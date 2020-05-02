import React from 'react';

import { PostData } from 'src/loader/post';
import { Layout, LayoutProps } from 'src/template/components/layout';

interface Props extends PostData, LayoutProps {
    // ..
}

export function Template(props: Props) {
    return (
        <Layout {...props}>
            <div dangerouslySetInnerHTML={{ __html: props.html }} />
        </Layout>
    )
}
