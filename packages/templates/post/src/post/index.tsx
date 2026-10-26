import { dirname, resolve } from 'path';
import { type LayoutProps, Layout } from '@blog/template-layout';
import type { PostExportDataWithComponent } from '@blog/types';
import { stringifyClass } from '@xiao-ai/utils';
import Moment from 'moment';
import React from 'react';
import { ToContent } from '../to-content';
import * as blockquote from './blockquote';
import { Pre } from './code';
import * as hr from './hr';
import * as image from './image';
import styles from './index.jss';
import { Link } from './link';
import * as paragraph from './paragraph';
import { createHeadComponents } from './title';

export interface PostProps extends LayoutProps {
  /** 文章数据 */
  post: PostExportDataWithComponent;
}

export function Post(props: PostProps) {
  const { post: { utils, data, Component } } = props;
  const coverImage = props.coverImage ?? (data.coverImage
    ? resolve(dirname(data.filePath), data.coverImage)
    : undefined);
  const title = createHeadComponents();

  return (
    <Layout
      {...props}
      coverImage={coverImage}
      assets={utils.getAssetReferences()}
      description={data.description}
      keywords={data.tags.map(({ name }) => name)}
      publishedTime={data.create}
      modifiedTime={data.update}
    >
      <article
        className={stringifyClass(styles.classes.postDefault, {
          [styles.classes.postNoToc]: !data.toc,
        })}
        style={props ? undefined : { width: '100%' }}
      >
        <header className={styles.classes.postHeader}>
          <h1 className={styles.classes.postHeaderTitle}>{data.title}</h1>
          <time
            className={styles.classes.postHeaderCreate}
            dateTime={new Date(data.create).toISOString()}
          >
            {Moment.utc(data.create).format('yyyy-MM-DD')}
          </time>
        </header>
        <div className={styles.classes.postArticle}>
          <Component
            post={data}
            components={{
              a: Link,
              pre: Pre,
              ...title,
              ...image,
              ...paragraph,
              ...hr,
              ...blockquote,
            }}
          />
        </div>
      </article>
      {data.toc && <ToContent data={data.ast} />}
    </Layout>
  );
}
