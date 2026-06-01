import { cut } from '@xiao-ai/utils';
import type { Page } from '../model/page';

export interface PageNav {
  older?: string;
  newer?: string;
  index: number;
  count: number;
}

/** 计算当前页的导航链接（上一页/下一页），边界页不生成越界链接 */
export function pageNav(
  urlForIndex: (i: number) => string,
  index: number,
  total: number,
): PageNav {
  return {
    older: index === total - 1 ? undefined : urlForIndex(index + 1),
    newer: index === 0 ? undefined : urlForIndex(index - 1),
    index,
    count: total,
  };
}

/** 通用分页工厂：将数据按 pageSize 切分后，逐页调用 buildPage 生成 Page 数组 */
export function paginate<T>(
  items: T[],
  pageSize: number,
  urlForIndex: (i: number) => string,
  buildPage: (chunk: T[], nav: PageNav) => Page,
): Page[] {
  const chunks = cut(items, pageSize);
  return chunks.map((chunk, i) =>
    buildPage(chunk, pageNav(urlForIndex, i, chunks.length)),
  );
}
