import React from 'react';
import Moment from 'moment';
import styles from './index.jss';

// import { Tags } from '../../components/icons';
import { Layout, LayoutProps } from '@blog/template-layout';
import { parseUrl } from '@blog/utils';

interface PostProps {
  title: string;
  pathname: string;
  tags: string[];
  create: number;
  description: string;
}

function Post(post: PostProps) {
  return <section className={styles.classes.postsListItem}>
    <header className={styles.classes.postsListItemHeader}>
      <span>
        <a href={parseUrl(post.pathname)}>{post.title}</a>
      </span>
      <time>{Moment(post.create).format('yyyy-MM-DD')}</time>
    </header>
    <article className={styles.classes.postsListItemDescription}>{post.description}</article>
    {post.tags.length !== 0 && <footer className={styles.classes.postsListItemFooter}>
      {/* <Tags /> */}
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

export function IndexRender(props: Props) {
  return (
    <Layout {...props}>
      <div className={styles.classes.postsList}>
        {(props.posts || []).map((post) => <Post key={post.create} {...post} />)}
      </div>
      <Pagination {...props} />
    </Layout>
  )
}
