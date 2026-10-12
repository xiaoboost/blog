import { Layout, type LayoutProps } from '@blog/template-layout';
import type { PostExportDataWithComponent } from '@blog/types';
import React from 'react';
import { Presentation } from './presentation';
import styles from './style.jss';

interface SlidePageProps extends LayoutProps {
  post: PostExportDataWithComponent;
}

export function SlidePage(props: SlidePageProps) {
  const { post } = props;

  return (
    <Layout {...props} bodyClassName={styles.classes.page}>
      <Presentation title={post.data.title}>
        <post.Component post={post.data} />
      </Presentation>
    </Layout>
  );
}
