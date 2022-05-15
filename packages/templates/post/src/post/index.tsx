import React from 'react';
import Moment from 'moment';
import styles from './index.jss';

import { ToContent } from '../to-content';
import { stringifyClass } from '@xiao-ai/utils';
import { Layout, LayoutProps } from '@blog/template-layout';
import { Root } from 'mdast';

import * as title from './title';
import * as code from './code';
import * as paragraph from './paragraph';

interface PostData {
  title: string;
  create: number;
  toc: any;
  ast: Root;
  Component: (props: any) => JSX.Element;
}

export interface PostProps extends LayoutProps {
  /** 文章数据 */
  post: PostData;
}

export function Post(props: PostProps) {
  const { post } = props;

  return (
    <Layout {...props}>
      <section
        className={stringifyClass(styles.classes.postDefault, {
          [styles.classes.postNoToc]: !post.toc,
        })}
        style={props ? undefined : { width: '100%' }}
      >
        <header className={styles.classes.postHeader}>
          <h1 className={styles.classes.postHeaderTitle}>{post.title}</h1>
          <time className={styles.classes.postHeaderCreate}>
            {Moment(post.create).format('yyyy-MM-DD')}
          </time>
        </header>
        <article className={styles.classes.postArticle}>
          <post.Component
            components={{
              ...title,
              ...code,
              ...paragraph,
            }}
          />
        </article>
      </section>
      {post.toc && <ToContent data={post.ast} />}
    </Layout>
  );
}
