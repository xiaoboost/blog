import { usePostCoverImage } from '@blog/context/runtime';
import { Layout, type LayoutProps } from '@blog/template-layout';
import type { PostExportDataWithComponent } from '@blog/types';
import React from 'react';
import { Presentation } from './presentation';
import styles from './style.jss';

interface SlidePageProps extends LayoutProps {
  post: PostExportDataWithComponent;
}

export function SlidePage(props: SlidePageProps) {
  const { post: { utils, data, Component } } = props;
  const coverImage = usePostCoverImage(data, props.coverImage);

  return (
    <Layout
      {...props}
      coverImage={coverImage}
      assets={utils.getAssetReferences()}
      description={data.description}
      keywords={data.tags.map(({ name }) => name)}
      publishedTime={data.create}
      modifiedTime={data.update}
      bodyClassName={styles.classes.page}
    >
      <Presentation title={data.title}>
        <Component post={data} />
      </Presentation>
    </Layout>
  );
}
