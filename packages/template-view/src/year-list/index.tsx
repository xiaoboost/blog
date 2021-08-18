import React from 'react';

import { Layout, LayoutProps } from 'template/components/layout';

interface Props extends LayoutProps {
  years: Array<{
    year: string;
    url: string;
    number: number;
  }>;
}

export function Template(props: Props) {
  return (
    <Layout {...props}>
    year
    </Layout>
  )
}
