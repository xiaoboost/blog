import React from 'react';

import { Layout, LayoutProps } from 'template/components/layout';

interface Props extends LayoutProps {
  tags: Array<{
    name: string;
    url: string;
    number: number;
  }>;
}

export function Template(props: Props) {
  return (
    <Layout {...props}>
    tags
    </Layout>
  )
}
