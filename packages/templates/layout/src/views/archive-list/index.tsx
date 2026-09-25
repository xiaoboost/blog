import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import type { ArchiveYearGroup } from '@blog/types';
import Moment from 'moment';
import React from 'react';
import { Layout, type LayoutProps } from '../../components/layout';
import { Pagination, type PaginationProps } from '../../components/pagination';
import { ArchiveYearFontFamily, ListItemTitleFontFamily, ListTitleFontFamily } from '../../constant/font';
import styles from './index.jss';

export interface ArchiveListProps extends LayoutProps, PaginationProps {
  listTitle: string;
  yearRange: string;
  groups: ArchiveYearGroup[];
}

export function ArchiveList(props: ArchiveListProps) {
  const { site, page, isPreBuild } = useRenderContext();
  const { classes } = styles;

  if (isPreBuild) {
    site.getFontBucket(ListTitleFontFamily).addText(props.listTitle);
    page.getFontBucket(ListItemTitleFontFamily).addText(
      props.groups.flatMap((group) => group.posts.map((post) => post.data.title)).join(''),
    );
    page.getFontBucket(ArchiveYearFontFamily).addText(props.groups.map((group) => group.year).join(''));
  }

  return (
    <Layout {...props} bodyClassName={classes.archiveBody}>
      <div className={classes.heading}>
        <h1>{props.listTitle}</h1>
        <span className={classes.range}>{props.yearRange}</span>
      </div>
      <div className={classes.paper}>
        {props.groups.map((group) => (
          <section key={group.year} className={classes.yearGroup} aria-labelledby={`archive-year-${group.year}`}>
            <div className={classes.yearLabel}>
              <h2 id={`archive-year-${group.year}`}>
                {group.year}
                {group.continued && (
                  <span className={classes.continued} title={`接续上一页的 ${group.year} 年文章`}>续</span>
                )}
              </h2>
              <span className={classes.yearCount}>
                {group.posts.length === group.total ? `${group.total} 篇` : `本页 ${group.posts.length} / ${group.total} 篇`}
              </span>
            </div>
            <ul className={classes.entries}>
              {group.posts.map(({ data: post }) => {
                const date = Moment(post.create);
                return (
                  <li key={post.pathname} className={classes.row}>
                    <a href={normalizeUrl(post.pathname)}>{post.title}</a>
                    <time dateTime={date.format('YYYY-MM-DD')} title={date.format('YYYY-MM-DD')}>
                      {date.format('MM / DD')}
                    </time>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <Pagination {...props} />
    </Layout>
  );
}
