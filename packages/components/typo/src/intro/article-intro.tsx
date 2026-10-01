import { stringifyClass } from '@xiao-ai/utils';
import React, { useId } from 'react';
import styles from './article-intro.jss';

export interface ArticleIntroProps {
  /** 导读小标题，默认“开始之前”。 */
  label?: string;
  /** 可选的左栏；省略时导读占满宽度。 */
  aside?: React.ReactNode;
  /** 导读正文，支持 MDX 段落、强调和链接。 */
  children: React.ReactNode;
}

/** 文章开篇的简短导读，可搭配作品介绍或其他左栏内容。 */
export function ArticleIntro({ label = '开始之前', aside, children }: ArticleIntroProps) {
  const { classes } = styles;
  const labelId = useId();
  const hasAside = React.Children.toArray(aside).some((node) => node !== '');

  return (
    <section
      className={stringifyClass(classes.articleIntro, { [classes.withAside]: hasAside })}
      aria-labelledby={label ? labelId : undefined}
    >
      {hasAside && <div className={classes.introAside}>{aside}</div>}
      <div className={classes.introContent}>
        {label && <div className={classes.introLabel} id={labelId}>{label}</div>}
        <div className={classes.introLead}>{children}</div>
      </div>
    </section>
  );
}
