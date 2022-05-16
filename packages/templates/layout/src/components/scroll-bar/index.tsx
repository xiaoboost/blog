import React from 'react';
import styles from './index.jss';

export function ScrollBar() {
  return (
    <div className={`${styles.classes.scrollbar} ${styles.classes.invisible}`}>
      <div className={styles.classes.slider}></div>
    </div>
  );
}
