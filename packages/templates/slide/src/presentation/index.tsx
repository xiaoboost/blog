import { type ReactNode } from 'react';
import { Loading, LoadingError } from '../loading';
import { Toolbar } from '../toolbar';
import styles from './index.jss';

interface PresentationProps {
  title: string;
  showPageNumber: boolean;
  children: ReactNode;
}

export function Presentation({ title, children, showPageNumber }: PresentationProps) {
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
        <Toolbar title={title} showPageNumber={showPageNumber} />
        <noscript>请启用 JavaScript 查看幻灯片。</noscript>
      </article>
      <LoadingError />
    </div>
  );
}
