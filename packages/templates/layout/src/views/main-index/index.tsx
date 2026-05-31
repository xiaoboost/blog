import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import type { PostExportData } from '@blog/types';
import Moment from 'moment';
import React from 'react';
import { Tags } from '../../components/icons';
import { type LayoutProps, Layout } from '../../components/layout';
import { type PaginationProps, Pagination } from '../../components/pagination';
import { ListItemTitleFontFamily } from '../../constant/font';

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
          <Tags className={styles.classes.postsListItemFooterIcon} />
          {post.tags.map((tag, i, arr) => (
            <React.Fragment key={tag.name}>
              <a
                href={tag.url}
                title={`跳转至“${tag.name}”标签页面`}
                className={styles.classes.postsListItemFooterTag}
              >
                {tag.name}
              </a>
              {i !== arr.length - 1 && (
                <span className={styles.classes.postsListItemFooterTagSplit}>、</span>
              )}
            </React.Fragment>
          ))}
        </footer>
      )}
    </section>
  );
}

export interface MainIndexProps extends LayoutProps, PaginationProps {
  posts: PostExportData[];
}

export function MainIndex(props: MainIndexProps) {
  const { isPreBuild, page } = useRenderContext();

  // 预构建阶段收集列表项标题字体字符
  if (isPreBuild && page) {
    const bkt = page.getFontBucket(ListItemTitleFontFamily);

    for (const post of props.posts ?? []) {
      bkt.addText(post.data.title);
    }
  }

  return (
    <Layout {...props}>
      <section className={styles.classes.postsList}>
        {(props.posts ?? []).map((post) => (
          <Post key={post.data.create} {...post} />
        ))}
      </section>
      <Pagination {...props} />
    </Layout>
  );
}
