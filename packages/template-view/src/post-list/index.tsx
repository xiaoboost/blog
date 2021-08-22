import React from 'react';

import { Layout, LayoutProps } from '@blog/template-layout';

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
