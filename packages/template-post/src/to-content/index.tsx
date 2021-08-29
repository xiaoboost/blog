// import './index.styl';

import React from 'react';
// import type Token from 'markdown-it/lib/token';

// import { Markdown } from 'build/markdown';
// import { toPinyin } from 'build/utils/string';
import { levelLimit } from './constant';
import { stringifyClass } from '@xiao-ai/utils';

export const pluginName = 'toc';

export interface Props {
  // tokens: Token[];
}

interface NavTitle {
  content: string;
  hash: string;
  level: number;
  parent?: NavTitle;
  children?: NavTitle[];
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

export function ToContent(props: Props) {
  // const titles = createTitles(tokens, levelLimit);

  return <aside>
    {/* <header className='menu-list-header'>目录</header>
    <article className='menu-list-article'>
      <NavTitle titles={titles} />
    </article> */}
  </aside>;
}
