import { normalizeUrl } from '@blog/node';
import React from 'react';

import { ArrowRight, ArrowLeft } from '../icons';

import styles from './index.jss';

const { classes } = styles;

export interface PaginationProps {
  newer?: string;
  older?: string;
}

export function Pagination({ newer, older }: PaginationProps) {
  if (!newer && !older) {
    return <></>;
  }

  return (
    <nav className={classes.pagination} aria-label="文章分页">
      {older
        ? (
          <a className={classes.paginationAction} href={normalizeUrl(older)}>
            <ArrowLeft />
            {' '}
            旧闻
          </a>
        )
        : (
          <div></div>
        )}
      {newer
        ? (
          <a className={classes.paginationAction} href={normalizeUrl(newer)}>
            新篇
            {' '}
            <ArrowRight />
          </a>
        )
        : (
          <div></div>
        )}
    </nav>
  );
}
