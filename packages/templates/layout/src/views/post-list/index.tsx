import React from 'react';
import Moment from 'moment';
import type { PostExportData } from '@blog/types';
import { LayoutProps } from '../../components/layout';
import { PaginationProps } from '../../components/pagination';
import { ItemListProps, ItemList } from '../item-list';

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
