import React from 'react';
import styles from './index.jss';

import { ScrollMode } from './constant';

export interface ScrollBarProps {
  width: number;
  mode?: ScrollMode;
}

export function ScrollBar(props: ScrollBarProps) {
  return (
    <div
      data-width={props.width}
      data-mode={props.mode ?? 'y'}
      className={`${styles.classes.scrollbar} ${styles.classes.invisible}`}
    >
      <div className={styles.classes.slider}></div>
    </div>
  );
}
