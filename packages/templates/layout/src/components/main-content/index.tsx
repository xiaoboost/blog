import { stringifyClass } from '@xiao-ai/utils';
import { default as React, type PropsWithChildren } from 'react';

import styles from './index.jss';

export interface MainContentProps {
  bodyClassName?: string;
}

export function MainContent({ children, bodyClassName }: PropsWithChildren<MainContentProps>) {
  return (
    <main className={styles.classes.mainArticleWrapper}>
      <div className={stringifyClass(styles.classes.mainArticle, bodyClassName)}>{children}</div>
    </main>
  );
}
