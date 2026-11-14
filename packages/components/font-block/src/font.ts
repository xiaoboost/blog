import { onBuildWithRender } from '@blog/context/runtime';
import type { IPage } from '@blog/types';
import {
  getFontContentBySrc,
  getFontFamily,
  resolveFontPath,
  type FontFileCache,
} from './utils';

interface FontBlockInput {
  src: string;
  baseDir?: string;
  text: string;
}

interface FontBlockData {
  src: string;
  family: string;
  text: string[];
}

/** 收集字体块文字、构建页面字体并提供类名 */
export const useFontBlock = onBuildWithRender<FontBlockInput, string>(({
  hooks,
  getAccessor,
  resolve,
  addWatchFiles,
}) => {
  const pageFonts = new WeakMap<IPage, Map<string, FontBlockData>>();
  const pendingFiles = new Map<string, Promise<Buffer>>();
  const fileCache = getAccessor('font-block:source', () => new Map<string, FontFileCache>()).get();

  // 排在模板字体之前，保持页面 CSS 和 preload 的顺序。
  hooks.beforeBuild.tapPromise({ name: 'font-block', stage: -100 }, async ({ pages, rename }) => {
    await Promise.all(pages.map(async (page) => {
      const fonts = pageFonts.get(page);

      if (!fonts?.size) {
        return;
      }

      const families: string[] = [];

      for (const data of fonts.values()) {
        const content = await getFontContentBySrc(data.src, fileCache, pendingFiles);
        const bucket = page.ensureFontBucket(data.family, content);

        bucket.addText(...data.text);
        families.push(data.family);
      }

      await page.buildFonts({
        families,
        scope: page.pathname,
        cssFileName: 'font-block',
        cssMode: 'full',
        format: rename,
      });
    }));
  });

  return ({ src, baseDir, text }, { page, isPreBuild }) => {
    const fontPath = resolveFontPath(src, {
      postPath: page.type === 'post' ? page.data.post.data.filePath : undefined,
      baseDir,
      resolve,
    });
    let fonts = pageFonts.get(page);

    // 登记字体依赖，字体缺失后重新创建也能触发重建。
    addWatchFiles(fontPath);

    if (isPreBuild) {
      if (!fonts) {
        fonts = new Map();
        pageFonts.set(page, fonts);
      }

      let data = fonts.get(fontPath);

      if (!data) {
        const used = new Set([
          ...page.getFontBuckets().keys(),
          ...Array.from(fonts.values(), (font) => font.family),
        ]);
        data = { src: fontPath, family: getFontFamily(fontPath, used), text: [] };
        fonts.set(fontPath, data);
      }

      data.text.push(text);
      return '';
    }

    const data = fonts?.get(fontPath);

    if (!data) {
      throw new Error(`FontBlock 未在预渲染中收集字体：${fontPath}（页面：${page.pathname}）`);
    }

    return page.getFontBucket(data.family).getClassName();
  };
});
