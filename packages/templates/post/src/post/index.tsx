import React from 'react';
import Moment from 'moment';
import styles from './index.jss';

import { ToContent } from '../to-content';
import { stringifyClass } from '@xiao-ai/utils';
import { MDXProvider } from '@mdx-js/react';
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
  Component: () => JSX.Element;
}

export interface Props extends LayoutProps {
  /** 文章数据 */
  post: PostData;
}

export function PostRender(props: Props) {
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
          <MDXProvider
            components={{
              ...title,
              ...code,
              ...paragraph,
            }}
          >
            <post.Component />
          </MDXProvider>
        </article>
      </section>
      {post.toc && <ToContent data={post.ast} />}
    </Layout>
  );
}
