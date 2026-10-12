import React from 'react';
import styles from './index.jss';

export function Loading() {
  return (
    <div className={styles.classes.loading} role="status" aria-label="正在加载幻灯片">
      <span className={styles.classes.spinner} />
    </div>
  );
}
