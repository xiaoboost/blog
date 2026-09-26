import React from 'react';
import styles from './index.jss';

export interface AuthorNoteProps {
  /** 作者的补充说明或临时联想，支持 MDX 段落和行内元素 */
  children: React.ReactNode;
}

/** 正文之外的简短旁注，以淡色小字和开放角线区分。 */
export function AuthorNote({ children }: AuthorNoteProps) {
  return <aside className={styles.classes.authorNote}>{children}</aside>;
}
