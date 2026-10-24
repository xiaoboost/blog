import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import styles from './index.jss';

export interface CommentProps {
  /** 作者的补充说明或临时联想，支持 MDX 段落和行内元素 */
  children: React.ReactNode;
  /** 是否将段落首行缩进两格，默认不缩进 */
  indent?: boolean;
}

/** 作者的旁注与评论，以淡色小字和开放角线区分。 */
export function Comment({ children, indent = false }: CommentProps) {
  const { classes } = styles;

  return (
    <aside className={stringifyClass(classes.comment, { [classes.indent]: indent })}>
      {children}
    </aside>
  );
}
