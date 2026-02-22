import React from 'react';
import { normalizeUrl } from '@blog/node';
import { isPreBuild } from '@blog/context/runtime';
import { Layout, LayoutProps } from '../../components/layout';
import { Pagination, PaginationProps } from '../../components/pagination';
import { ListTitleFontBucket, ListItemTitleFontBucket } from '../../utils/title';
import styles from './index.jss';

interface ItemData {
  title: string;
  subTitle: string;
  url: string;
}

export interface ItemListProps extends LayoutProps, PaginationProps {
  listTitle: string;
  data: ItemData[];
}

export function ItemList(props: ItemListProps) {
  if (isPreBuild()) {
    ListTitleFontBucket.addText(props.listTitle);
    ListItemTitleFontBucket.addText(props.data.map((data) => data.title).join(''));
  }

  return (
    <Layout {...props} bodyClassName={styles.classes.itemListBody}>
      <h1 className={styles.classes.itemListTitle}>{props.listTitle}</h1>
      <div className={styles.classes.itemList}>
        {props.data.map((data) => (
          <div key={data.url} className={styles.classes.itemListItem}>
            <span>
              <a href={normalizeUrl(data.url)}>{data.title}</a>
            </span>
            <time>{data.subTitle}</time>
          </div>
        ))}
      </div>
      <Pagination {...props} />
    </Layout>
  );
}
