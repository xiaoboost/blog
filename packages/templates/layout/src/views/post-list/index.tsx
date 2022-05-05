import React from 'react';

import { Layout, LayoutProps } from '../../components/layout';

interface PostListProps extends LayoutProps {
  posts: Array<{
    title: string;
    url: string;
  }>;
}

export function PostList(props: PostListProps) {
  return <Layout {...props}>posts</Layout>;
}
