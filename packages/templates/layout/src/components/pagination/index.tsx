import { normalizeUrl } from '@blog/node';
import { getPageIndexes } from '@blog/shared';
import React from 'react';

import { ArrowRight, ArrowLeft } from '../icons';

import styles from './index.jss';

const { classes } = styles;

export interface PaginationProps {
  newer?: string;
  older?: string;
  numbered?: NumberedPagination;
}

export interface NumberedPagination {
  /** 从 0 开始的当前页索引 */
  index: number;
  count: number;
  urlForIndex(index: number): string;
}

export function Pagination({ newer, older, numbered }: PaginationProps) {
  if (!newer && !older) {
    return <></>;
  }

  return (
    <nav className={classes.pagination} aria-label="文章分页">
      <div className={classes.newer}>
        {newer && (
          <a className={classes.paginationAction} href={normalizeUrl(newer)} rel="prev" aria-label="新篇">
            <ArrowLeft />
            {' 新篇'}
          </a>
        )}
      </div>
      {numbered && numbered.count > 1 && (
        <div className={classes.pageNumbers}>
          {getPageIndexes(numbered.index, numbered.count).map((index, position) => {
            if (index === 'gap') {
              return <span key={`gap-${position}`} className={classes.pageNumber} aria-hidden="true">…</span>;
            }
            return index === numbered.index
              ? <span key={index} className={classes.pageNumber} aria-current="page" aria-label={`第 ${index + 1} 页`}>{index + 1}</span>
              : <a key={index} className={classes.pageNumber} href={normalizeUrl(numbered.urlForIndex(index))} aria-label={`第 ${index + 1} 页`}>{index + 1}</a>;
          })}
          <span className={classes.pageCount} aria-label={`第 ${numbered.index + 1} 页，共 ${numbered.count} 页`}>
            {`第 ${numbered.index + 1} / ${numbered.count} 页`}
          </span>
        </div>
      )}
      <div className={classes.older}>
        {older && (
          <a className={classes.paginationAction} href={normalizeUrl(older)} rel="next" aria-label="旧闻">
            {'旧闻 '}
            <ArrowRight />
          </a>
        )}
      </div>
    </nav>
  );
}
