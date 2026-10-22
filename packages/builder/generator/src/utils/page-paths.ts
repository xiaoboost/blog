import { normalize, normalizeUrl } from '@blog/node';
import type { IPage } from '@blog/types';

function describePage(page: IPage) {
  return page.type === 'post'
    ? `文章「${page.title}」：${page.data.post.data.filePath}`
    : `页面「${page.title}」（${page.type}）`;
}

/** 页面共用输出目录，在渲染前检查，避免同名文件互相覆盖。 */
export function assertUniquePagePaths(pages: IPage[]) {
  const paths = new Map<string, IPage>();

  for (const page of pages) {
    // 与 Page.toAsset 使用相同的输出规则，兼容首尾斜杠等写法差异。
    const outputPath = normalize('/', page.pathname, 'index.html');
    const previous = paths.get(outputPath);

    if (previous) {
      throw new Error([
        `页面路径重复：${normalizeUrl(page.pathname)}`,
        `输出文件：${outputPath}`,
        `- ${describePage(previous)}`,
        `- ${describePage(page)}`,
      ].join('\n'));
    }

    paths.set(outputPath, page);
  }
}
