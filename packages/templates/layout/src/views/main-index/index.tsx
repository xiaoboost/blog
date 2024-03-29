import React from 'react';
import Moment from 'moment';
import type { PostExportData } from '@blog/types';
import { normalizeUrl } from '@blog/node';

// import { Tags } from '../../components/icons';
import { Layout, LayoutProps } from '../../components/layout';

import styles from './index.jss';

function Post({ data: post }: PostExportData) {
  return (
    <section className={styles.classes.postsListItem}>
      <header className={styles.classes.postsListItemHeader}>
        <span>
          <a href={normalizeUrl(post.pathname)}>{post.title}</a>
        </span>
        <time>{Moment(post.create).format('yyyy-MM-DD')}</time>
      </header>
      <article className={styles.classes.postsListItemDescription}>{post.description}</article>
      {post.tags.length !== 0 && (
        <footer className={styles.classes.postsListItemFooter}>
          {/* <Tags /> */}
          {post.tags.map((tag) => (
            <a key={tag}>{tag}</a>
          ))}
        </footer>
      )}
    </section>
  );
}

interface PaginationProps {
  next?: string;
  pre?: string;
}

function Pagination(props: PaginationProps) {
  if (!props.next && !props.pre) {
    return <></>;
  }

  return <div className='pagination'>TODO: Pagination</div>;
}

export interface MainIndexProps extends LayoutProps, PaginationProps {
  index: number;
  posts: PostExportData[];
}

export function MainIndex(props: MainIndexProps) {
  return (
    <Layout {...props}>
      <div className={styles.classes.postsList}>
        {(props.posts || []).map((post) => (
          <Post key={post.data.create} {...post} />
        ))}
      </div>
      {/* <Pagination {...props} /> */}
    </Layout>
  );
}
