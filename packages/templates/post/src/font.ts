import { onBuild } from '@blog/context/runtime';
import FirstTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';
import SecondTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-SemiBold.otf?raw';
import type { BuildContext, PageDataMap } from '@blog/types';
import { PostTemplate, FirstTitleFontFamily, SecondTitleFontFamily } from './constant';
import { getNavList } from './to-content';

onBuild((runtime) => {
  // 注册字体桶
  runtime.hooks.afterReady.tap(PostTemplate, (ctx: BuildContext) => {
    for (const page of ctx.pages) {
      if (page.type !== 'post') continue;
      page.ensureFontBucket(FirstTitleFontFamily, FirstTitleFontFile);
      page.ensureFontBucket(SecondTitleFontFamily, SecondTitleFontFile);
    }
  });

  // 收集字符 + 构建字体
  runtime.hooks.beforeBuild.tapPromise(PostTemplate, async ({ rename, pages }: BuildContext) => {
    await Promise.all(
      pages
        .filter((page) => page.type === 'post')
        .map(async (page) => {
          const d = page.data as PageDataMap['post'];
          const post = d.post;
          const titles = getNavList(post.data.ast);

          page.getFontBucket(FirstTitleFontFamily).addText(post.data.title);

          for (const title of titles) {
            if (title.level === 1) {
              page.getFontBucket(FirstTitleFontFamily).addText(title.content);
            }
            else {
              page.getFontBucket(SecondTitleFontFamily).addText(title.content);
            }
          }

          await page.buildFonts({
            families: [FirstTitleFontFamily, SecondTitleFontFamily],
            scope: page.pathname,
            cssFileName: 'heading',
            cssMode: 'font-face',
            format: rename,
          });
        }),
    );
  });
});
