import React from 'react';
import styles from './index.jss';

import { PropsWithChildren } from 'react';
import { EmptyObject } from '@xiao-ai/utils';

// import { GotoTop, pluginName } from 'template/plugins/goto-top';

// export interface Props {
//   plugins: string[];
// }

export function Article({ children }: PropsWithChildren<EmptyObject>) {
  return (
    <article className={styles.classes.mainArticleWrapper}>
      <div className={styles.classes.mainArticle}>
        {children}
      </div>
      {/* <GotoTop /> */}
    </article>
  );
}
