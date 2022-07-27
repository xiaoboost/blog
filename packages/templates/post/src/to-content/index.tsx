import React from 'react';
import styles from './index.jss';

import { toPinyin } from '@blog/shared/node';
import { levelLimit } from './constant';
import { stringifyClass } from '@xiao-ai/utils';
import { Root, Heading, PhrasingContent } from 'mdast';
import { Circle, CircleThin } from '@blog/icons';

export interface Props {
  data: Root;
}

export interface NavTitleData {
  content: string;
  hash: string;
  level: number;
  parent?: NavTitleData;
  children?: NavTitleData[];
}

export interface NavTitleProps {
  titles: NavTitleData[];
}

function getContext(node: Heading | PhrasingContent): string {
  if ('children' in node) {
    return node.children.map(getContext).join('');
  } else if ('value' in node) {
    return node.value;
  } else {
    return '';
  }
}

function createNavFromAst(ast: Root, limit: number): NavTitleData[] {
  const root: NavTitleData = {
    content: 'root',
    hash: '',
    level: 0,
    children: [],
  };

  let current = root;

  for (let i = 0; i < ast.children.length; i++) {
    const token = ast.children[i];

    if (token.type !== 'heading' || token.depth > levelLimit) {
      continue;
    }

    const content = getContext(token);
    const hash = toPinyin(content);
    const level = token.depth;

    if (level > current.level) {
      const now: NavTitleData = {
        content,
        hash,
        level,
        parent: current,
      };

      if (!current.children) {
        current.children = [];
      }

      current.children.push(now);
      current = now;
    } else if (level === current.level) {
      const now: NavTitleData = {
        content,
        hash,
        level: current.level,
        parent: current.parent,
      };

      current.parent!.children!.push(now);
      current = now;
    } else if (level < current.level) {
      let parent = current;

      while (level <= parent.level) {
        if (!parent.parent) {
          throw new Error(`错误的标题等级：${level}`);
        }

        parent = parent.parent;
      }

      const now: NavTitleData = {
        content,
        level,
        hash,
        parent,
      };

      parent.children?.push(now);
      current = now;
    }
  }

  return root.children!;
}

function NavTitle({ titles }: NavTitleProps) {
  const { classes: cla } = styles;

  return (
    <ul className={cla.menuList}>
      {titles.map((title, i) => (
        <li key={i} className={stringifyClass(cla.menuItem, cla[`menuLevel${title.level}`])}>
          <a href={`#${title.hash}`}>
            {title.level === 1 ? (
              <Circle className={cla.menuIcon} />
            ) : (
              <CircleThin className={cla.menuIcon} />
            )}
            {title.content}
          </a>
          {title.children && <NavTitle titles={title.children} />}
        </li>
      ))}
    </ul>
  );
}

export function ToContent({ data }: Props) {
  const titles = createNavFromAst(data, levelLimit);

  return (
    <aside className={styles.classes.toContent}>
      <header className={styles.classes.menuListHeader}>目录</header>
      <article className={styles.classes.menuListArticle}>
        <NavTitle titles={titles} />
      </article>
    </aside>
  );
}