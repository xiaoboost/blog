import React from 'react';
import Moment from 'moment';
import { stringifyClass } from '@xiao-ai/utils';
import { Layout, LayoutProps } from '@blog/template-layout';
import type { PostExportDataWithComponent } from '@blog/types';

import styles from './index.jss';

import { ToContent } from '../to-content';

import * as title from './title';
import * as code from './code';
import * as image from './image';
import * as paragraph from './paragraph';

import { Link } from './link';

export interface PostProps extends LayoutProps {
  /** 文章数据 */
  post: PostExportDataWithComponent;
}

export function Post(props: PostProps) {
  const { post } = props;
  const a = Link(post.data);

  return (
    <Layout {...props}>
      <section
        className={stringifyClass(styles.classes.postDefault, {
          [styles.classes.postNoToc]: !post.data.toc,
        })}
        style={props ? undefined : { width: '100%' }}
      >
        <header className={styles.classes.postHeader}>
          <h1 className={styles.classes.postHeaderTitle}>{post.data.title}</h1>
          <time className={styles.classes.postHeaderCreate}>
            {Moment(post.data.create).format('yyyy-MM-DD')}
          </time>
        </header>
        <article className={styles.classes.postArticle}>
          <post.Component
            components={{
              a,
              ...title,
              ...code,
              ...image,
              ...paragraph,
            }}
          />
        </article>
      </section>
      {post.data.toc && <ToContent data={post.data.ast} />}
    </Layout>
  );
}
