import React from 'react';

import { PropsWithChildren } from 'react';
import { EmptyObject } from '@xiao-ai/utils';

import styles from './index.jss';

export function Article({ children }: PropsWithChildren<EmptyObject>) {
  return (
    <article className={styles.classes.mainArticleWrapper}>
      <div className={styles.classes.mainArticle}>{children}</div>
    </article>
  );
}
