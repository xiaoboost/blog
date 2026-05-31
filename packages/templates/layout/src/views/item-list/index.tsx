import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import React from 'react';
import { type LayoutProps, Layout } from '../../components/layout';
import { type PaginationProps, Pagination } from '../../components/pagination';
import { ListTitleFontFamily, ListItemTitleFontFamily } from '../../constant/font';
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
  const { isPreBuild, site, page } = useRenderContext();

  // 预构建阶段收集标题字体字符
  if (isPreBuild) {
    site.getFontBucket(ListTitleFontFamily).addText(props.listTitle);
    page.getFontBucket(ListItemTitleFontFamily).addText(
      props.data.map((d) => d.title).join(''),
    );
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
