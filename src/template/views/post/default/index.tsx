import React from 'react';

import { Layout } from 'src/template/components/layout';
import { PostData } from 'src/loader/post';

interface Props extends PostData {
    styleFile: string;
    scriptFile: string;
}

export function Template(props: Props) {
    return (
        <Layout {...props}>
            <div dangerouslySetInnerHTML={{ __html: props.html }} />
        </Layout>
    )
}
