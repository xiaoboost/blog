import React from 'react';
import styles from './index.jss';

export interface CommentProps {
  /** 作者的补充说明或临时联想，支持 MDX 段落和行内元素 */
  children: React.ReactNode;
}

/** 正文之外的简短旁注，以淡色小字和开放角线区分。 */
export function Comment({ children }: CommentProps) {
  return <aside className={styles.classes.comment}>{children}</aside>;
}
