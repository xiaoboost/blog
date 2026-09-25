import React from 'react';
import styles from './index.jss';

export interface DefinitionListProps {
  /** 名称与说明条目，使用 Definition 组件 */
  children: React.ReactNode;
}

export interface DefinitionProps {
  /** 名称，支持文本和行内元素 */
  term: React.ReactNode;
  /** 可选的英文名或别名 */
  alias?: string;
  /** 解释内容，直接接收 MDX 编译后的段落等元素 */
  children: React.ReactNode;
}

/** 名称与说明列表，章节标题由文章单独提供。 */
export function DefinitionList({ children }: DefinitionListProps) {
  return <dl className={styles.classes.definitions}>{children}</dl>;
}

/** 单个名称及其解释，应放在 DefinitionList 中。 */
export function Definition({ term, alias, children }: DefinitionProps) {
  const { classes } = styles;

  return (
    <div className={classes.definition}>
      <dt className={classes.term}>
        {term}
        {alias && <span className={classes.alias}>{alias}</span>}
      </dt>
      <dd className={classes.description}>{children}</dd>
    </div>
  );
}
