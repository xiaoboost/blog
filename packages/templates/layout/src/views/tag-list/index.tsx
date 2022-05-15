import React from 'react';

import { Layout, LayoutProps } from '../../components/layout';

interface TagListProps extends LayoutProps {
  tags: Array<{
    name: string;
    url: string;
    number: number;
  }>;
}

export function TagList(props: TagListProps) {
  return <Layout {...props}>tags</Layout>;
}
