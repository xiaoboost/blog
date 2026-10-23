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
    const outputPath = normalize('/', page.outputPath);
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

  // 文件不能同时作为其他页面的目录，例如 /404.html 与 /404.html/index.html。
  for (const [outputPath, page] of paths) {
    const parts = outputPath.split('/');
    for (let i = 2; i < parts.length; i++) {
      const ancestor = parts.slice(0, i).join('/');
      const previous = paths.get(ancestor);

      if (previous) {
        throw new Error([
          '页面路径重复：文件与目录冲突',
          `输出文件：${ancestor} 与 ${outputPath}`,
          `- ${describePage(previous)}`,
          `- ${describePage(page)}`,
        ].join('\n'));
      }
    }
  }
}
