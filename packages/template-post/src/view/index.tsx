import React from 'react';
import Moment from 'moment';
import styles from './index.jss';

import { ToContent } from '../to-content';
import { PostData } from '@blog/posts';
import { Layout, LayoutProps } from '@blog/template-layout';

export interface Props extends LayoutProps {
  /** 文章数据 */
  post: PostData;
}

export function Render(props: Props) {
  const { post } = props;

  return (
    <Layout {...props}>
      <section
        className={styles.classes.postDefault}
        style={props ? undefined : { width: '100%' }}
      >
        <header className={styles.classes.postHeader}>
          <h1 className={styles.classes.postHeaderTitle}>{post.title}</h1>
          <time className={styles.classes.postHeaderCreate}>
            {Moment(post.create).format('yyyy-MM-DD')}
          </time>
        </header>
        <article
          className={styles.classes.postArticle}
          dangerouslySetInnerHTML={{ __html: '测试内容' }}
        />
      </section>
      {post.toc && <ToContent />}
    </Layout>
  )
}