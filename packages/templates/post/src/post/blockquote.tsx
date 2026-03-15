import React from 'react';
import { Quote } from '@blog/icons';
import styles from './index.jss';

export function blockquote(props: React.PropsWithChildren) {
  return (
    <blockquote>
      <Quote className={styles.classes.blockquoteIcon} />
      {props.children}
    </blockquote>
  );
}
