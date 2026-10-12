import { onBuild } from '@blog/context/runtime';
import PrimaryTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';
import SecondaryTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-SemiBold.otf?raw';
import type { BuildContext } from '@blog/types';
import { PostTemplate, PrimaryTitleFont, SecondaryTitleFont } from './constant';
import { getNavList } from './to-content';

onBuild((runtime) => {
  // 注册字体桶
  runtime.hooks.afterReady.tap(PostTemplate, (ctx: BuildContext) => {
    for (const page of ctx.pages) {
      if (page.type !== 'post' || page.data.post.data.template !== 'post') {
        continue;
      }

      page.ensureFontBucket(
        PrimaryTitleFont.fontFamily,
        PrimaryTitleFontFile,
        { fontWeight: PrimaryTitleFont.fontWeight },
      );
      page.ensureFontBucket(
        SecondaryTitleFont.fontFamily,
        SecondaryTitleFontFile,
        { fontWeight: SecondaryTitleFont.fontWeight },
      );
    }
  });

  // 收集字符 + 构建字体
  runtime.hooks.beforeBuild.tapPromise(PostTemplate, async ({ rename, pages }: BuildContext) => {
    await Promise.all(
      pages
        .filter((page) => page.type === 'post')
        .filter((page) => page.data.post.data.template === 'post')
        .map(async (page) => {
          const { post } = page.data;
          const titles = getNavList(post.data.ast);

          page.getFontBucket(PrimaryTitleFont.fontFamily).addText(post.data.title);

          for (const title of titles) {
            if (title.level === 1) {
              page.getFontBucket(PrimaryTitleFont.fontFamily).addText(title.content);
            }
            else {
              page.getFontBucket(SecondaryTitleFont.fontFamily).addText(title.content);
            }
          }

          await page.buildFonts({
            families: [PrimaryTitleFont.fontFamily, SecondaryTitleFont.fontFamily],
            scope: page.pathname,
            cssFileName: 'heading',
            cssMode: 'font-face',
            format: rename,
          });
        }),
    );
  });
});
