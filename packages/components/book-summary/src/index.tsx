import React from 'react';
import { getJsxNodesByTag, getAttribute } from '@blog/parser/walk';
import { forEach, defineUtils, RuntimeBuilder as Builder } from '@blog/context/runtime';
import { getBookData, getBookDataForUI, componentName } from './book';

import script from './book-summary.script';

export interface BookSummaryProps {
  /** 起点书籍编号 */
  id: number;
  /**
   * 书籍网站
   *
   * @default 'qidian'
   */
  kind?: 'qidian';
  /**
   * 默认书名
   *
   * @description 缓存和网络均无法获取书籍信息时，将会使用此值作为书名
   */
  fallbackName?: string;
}

/** 自定义字体块 */
export function BookSummary({ id, fallbackName }: BookSummaryProps) {
  const data = getBookDataForUI(id);

  if (!data) {
    if (fallbackName) {
      return <em>{fallbackName}</em>;
    } else {
      throw new Error(`组件 ${componentName}：书籍编号未找到数据，且没有默认书名。`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cover, ...uiData } = data;

  debugger;
  return (
    <a
      target='_blank'
      rel='noreferrer'
      href={uiData.url}
      data-book-summary={encodeURI(JSON.stringify(uiData))}
      data-id={id}
      // eslint-disable-next-line prettier/prettier
    ><em>《{data.title}》</em></a>
  );
}

export const utils = defineUtils(script);

forEach((runtime) => {
  runtime.hooks.beforeEachPost.tapPromise(componentName, async ({ data: { ast } }) => {
    const bookNodes = getJsxNodesByTag(ast, 'BookSummary');

    if (bookNodes.length === 0) {
      return;
    }

    for (const node of bookNodes) {
      const attr = getAttribute('id', node.attributes);

      if (!attr) {
        continue;
      }

      const data = await getBookData(Number(attr.value.value));

      if (!data) {
        continue;
      }

      Builder.emitAsset({
        path: data.coverUrl,
        content: data.cover,
      });
    }
  });
});
