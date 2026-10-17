import { Circle } from '@blog/icons';
import type { Mdx } from '@blog/types';
import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';

import { levelLimit } from './constant';
import styles from './index.jss';
import { getHeadingAnchors, getHeadHref, type HeadingAnchor } from './utils';

export interface Props {
  data: Mdx.Root;
}

export interface NavTitleData extends HeadingAnchor {
  parent?: NavTitleData;
  children?: NavTitleData[];
}

export interface NavTitleProps {
  titles: NavTitleData[];
}

export function getNavList(ast: Mdx.Root) {
  return getHeadingAnchors(ast);
}

function createNavFromAst(ast: Mdx.Root): NavTitleData[] {
  const root: NavTitleData = {
    content: 'root',
    hash: '',
    level: 0,
    children: [],
  };

  let current = root;

  for (const { content, hash, level } of getHeadingAnchors(ast)) {
    if (level > levelLimit) {
      continue;
    }

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
    }
    else if (level === current.level) {
      const now: NavTitleData = {
        content,
        hash,
        level: current.level,
        parent: current.parent,
      };

      current.parent!.children!.push(now);
      current = now;
    }
    else if (level < current.level) {
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
        <li
          key={i}
          className={stringifyClass(
            cla.menuItem,
            cla[`menuLevel${title.level}` as keyof typeof cla],
          )}
        >
          <a href={getHeadHref(title.hash)}>
            {title.level === 1 ? <Circle className={cla.menuIcon} /> : ''}
            <span className={cla.menuTitle}>{title.content}</span>
          </a>
          {title.children && <NavTitle titles={title.children} />}
        </li>
      ))}
    </ul>
  );
}

export function ToContent({ data }: Props) {
  const titles = createNavFromAst(data);

  return (
    <nav className={styles.classes.toContent} aria-label="文章目录">
      <div className={styles.classes.menuListHeader}>目录</div>
      <div className={styles.classes.menuListArticle}>
        <NavTitle titles={titles} />
      </div>
    </nav>
  );
}
