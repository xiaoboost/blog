import './index.styl';

import React from 'react';
import Moment from 'moment';

import { Tags } from '../../components/icons';
import { Layout, LayoutProps } from '../../components/layout';

import { parseUrl } from '@build/utils';

interface PostProps {
  title: string;
  pathname: string;
  tags: string[];
  create: number;
  description: string;
}

function Post(post: PostProps) {
  return <section className='posts-list__item'>
    <header className='posts-list__item-header'>
      <span>
        <a href={parseUrl(post.pathname)}>{post.title}</a>
      </span>
      <time>{Moment(post.create).format('yyyy-MM-DD')}</time>
    </header>
    <article className='posts-list__item-description'>{post.description}</article>
    {post.tags.length !== 0 && <footer className='posts-list__item-footer'>
      <Tags />
      {post.tags.map((tag) => (
        <a key={tag}>{tag}</a>
      ))}
    </footer>
    }
  </section>;
}

interface PaginationProps {
  next: string | null;
  pre: string | null;
}

function Pagination(props: PaginationProps) {
  if (!props.next && !props.pre) {
    return <></>;
  }

  return <div className='pagination'>
  TODO: Pagination
  </div>;
}

export interface Props extends LayoutProps, PaginationProps {
  posts: PostProps[];
}

export function Render(props: Props) {
  return (
    <Layout {...props}>
      <div className='posts-list'>
        {(props.posts || []).map((post) => <Post key={post.create} {...post} />)}
      </div>
      <Pagination {...props} />
    </Layout>
  )
}
