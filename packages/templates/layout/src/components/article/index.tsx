import { stringifyClass } from '@xiao-ai/utils';
import { default as React, type PropsWithChildren } from 'react';

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
