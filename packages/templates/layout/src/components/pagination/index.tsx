import React from 'react';
import { normalizeUrl } from '@blog/node';

import { ArrowRight, ArrowLeft } from '../icons';

import styles from './index.jss';

const { classes } = styles;

export interface PaginationProps {
  next?: string;
  pre?: string;
}

export function Pagination({ next, pre }: PaginationProps) {
  if (!next && !pre) {
    return <></>;
  }

  return (
    <section className={classes.pagination}>
      {next ? (
        <a className={classes.paginationAction} href={normalizeUrl(next)}>
          <ArrowLeft /> 下一页
        </a>
      ) : (
        <div></div>
      )}
      {pre ? (
        <a className={classes.paginationAction} href={normalizeUrl(pre)}>
          上一页 <ArrowRight />
        </a>
      ) : (
        <div></div>
      )}
    </section>
  );
}
