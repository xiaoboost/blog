import React from 'react';

import { PropsWithChildren } from 'react';
import { stringifyClass } from '@xiao-ai/utils';

import styles from './index.jss';

export interface ArticleProps {
  bodyClassName?: string;
}

export function Article({ children, bodyClassName }: PropsWithChildren<ArticleProps>) {
  return (
    <article className={styles.classes.mainArticleWrapper}>
      <div className={stringifyClass(styles.classes.mainArticle, bodyClassName)}>{children}</div>
    </article>
  );
}
