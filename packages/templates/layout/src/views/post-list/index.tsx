import type { PostExportData } from '@blog/types';
import Moment from 'moment';
import React from 'react';
import type { LayoutProps } from '../../components/layout';
import type { PaginationProps } from '../../components/pagination';
import { type ItemListProps, ItemList } from '../item-list';

interface PostListProps extends LayoutProps, PaginationProps {
  listTitle: string;
  posts: PostExportData[];
}

export function PostList(props: PostListProps) {
  const data: ItemListProps = {
    ...props,
    data: props.posts.map(({ data: post }) => ({
      title: post.title,
      subTitle: Moment(post.create).format('yyyy-MM-DD'),
      url: post.pathname,
    })),
  };

  return <ItemList {...data} />;
}
