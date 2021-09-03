import React from 'react';
import styles from './index.jss';

import { toPinyin } from '@blog/utils';
import { levelLimit } from './constant';
import { stringifyClass } from '@xiao-ai/utils';
import { PostRendered } from '@blog/posts';

type AST = PostRendered['ast'];

export interface Props {
  data: AST;
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

// function createTitles(tokens: Token[], deep = 2) {
//   const root: NavTitle = {
//     content: 'root',
//     hash: '',
//     level: 0,
//     children: [],
//   };

//   let current = root;

//   for (let i = 0; i < tokens.length; i++) {
//     const token = tokens[i];
//     const last = tokens[i - 1];

//     if (token.type !== 'inline' || last?.type !== 'heading_open') {
//       continue;
//     }

//     const levelMatchResult = /(\d+)$/.exec(last.tag);

//     if (!levelMatchResult) {
//       continue;
//     }

//     const level = Number.parseInt(levelMatchResult[1]);

//     if (level > deep) {
//       continue;
//     }

//     const content = Markdown.renderInline(token.content);
//     const hash = toPinyin(token.content);

//     if (level > current.level) {
//       const now: NavTitle = {
//         content,
//         hash,
//         level,
//         parent: current,
//       };

//       if (!current.children) {
//         current.children = [];
//       }

//       current.children.push(now);
//       current = now;
//     }
//     else if (level === current.level) {
//       const now: NavTitle = {
//         content,
//         hash,
//         level: current.level,
//         parent: current.parent,
//       };

//       current.parent!.children!.push(now);
//       current = now;
//     }
//     else if (level < current.level) {
//       let parent = current;

//       while (level <= parent.level) {
//         if (!parent.parent) {
//           throw new Error(`错误的标题等级：${level}`)
//         }

//         parent = parent.parent;
//       }

//       const now: NavTitle = {
//         content,
//         level,
//         hash,
//         parent,
//       };

//       parent.children?.push(now);
//       current = now;
//     }
//   }

//   return root.children!;
// }

// interface NavProps {
//   titles: NavTitle[];
// }

// function NavTitle({ titles }: NavProps) {
//   return <ul className="menu-list">
//     {titles.map((title, i) => (
//       <li key={i} className={stringifyClass('menu-item', `menu-level-${title.level}`)}>
//         <a
//           href={`#${title.hash}`}
//           className="menu-item__title"
//           dangerouslySetInnerHTML={{ __html: title.content }}
//         />
//         {title.children && <NavTitle titles={title.children} />}
//       </li>
//     ))}
//   </ul>;
// }

function createNavFromAst(ast: AST, limit: number): NavTitleData[] {
  return [];
}

function NavTitle({ titles }: NavTitleProps) {
  return <ul className={styles.classes.menuList}>
    {titles.map((title, i) => (
      <li
        key={i}
        className={stringifyClass(
          styles.classes.menuItem,
          styles.classes[`menuLevel${title.level}`],
        )}
      >
        <a
          href={`#${title.hash}`}
          dangerouslySetInnerHTML={{ __html: title.content }}
        />
        {title.children && <NavTitle titles={title.children} />}
      </li>
    ))}
  </ul>;
}

export function ToContent({ data }: Props) {
  const titles = createNavFromAst(data, levelLimit);

  return <aside className={styles.classes.toContent}>
    <header className={styles.classes.menuListHeader}>目录</header>
    <article className={styles.classes.menuListArticle}>
      <NavTitle titles={titles} />
    </article>
  </aside>;
}
