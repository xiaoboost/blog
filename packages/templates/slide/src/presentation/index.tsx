import React, { type ReactNode } from 'react';
import { Loading } from '../loading';
import { Toolbar } from '../toolbar';
import styles from './index.jss';

interface PresentationProps {
  title: string;
  children: ReactNode;
}

export function Presentation({ title, children }: PresentationProps) {
  return (
    <div className={styles.classes.presentation}>
      <article
        className={styles.classes.card}
        aria-label={title}
        aria-busy="true"
        tabIndex={0}
      >
        <div className={styles.classes.canvas}>{children}</div>
        <Loading />
        <Toolbar title={title} />
        <noscript>请启用 JavaScript 查看幻灯片。</noscript>
      </article>
    </div>
  );
}
