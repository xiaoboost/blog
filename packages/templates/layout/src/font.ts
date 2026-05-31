import { onBuild } from '@blog/context/runtime';
import ListTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';
import ListItemTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-SemiBold.otf?raw';
import type { BuildContext } from '@blog/types';
import SiteTitleFontFile from './assets/fonts/dancing/dancing.ttf?raw';
import { SiteTitleFontFamily, ListTitleFontFamily, ListItemTitleFontFamily } from './constant/font';

onBuild((runtime) => {
  // 注册共享字体
  runtime.hooks.afterReady.tap('layout:shared-fonts', ({ site }: BuildContext) => {
    site.ensureFontBucket(SiteTitleFontFamily, SiteTitleFontFile);
    site.ensureFontBucket(ListTitleFontFamily, ListTitleFontFile);
  });

  // 注册列表项标题字体
  runtime.hooks.afterReady.tap('layout:list-item-font', ({ pages }: BuildContext) => {
    for (const page of pages) {
      if (page.type === 'post') continue;
      page.ensureFontBucket(ListItemTitleFontFamily, ListItemTitleFontFile);
    }
  });

  // 构建 + 产出
  runtime.hooks.beforeBuild.tapPromise('layout:fonts-build', async ({ site, pages, rename }: BuildContext) => {
    // 全局字体构建
    await site.buildFonts({ cssFile: '/styles/layout-fonts.css', rename });
    // 每个页面字体构建
    await Promise.all(
      pages
        .filter((page) => page.type !== 'post')
        .map((page) =>
          page.buildFonts({
            cssFile: `${page.pathname}/styles/page-fonts.css`,
            rename,
          }),
        ),
    );
  });
});
