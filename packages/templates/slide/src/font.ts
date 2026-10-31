import { onBuild } from '@blog/context/runtime';
import { FontHeading, PrimaryTitleFont } from '@blog/styles';
import PrimaryTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';

const SlideTemplate = 'Slide:Template';

onBuild((runtime) => {
  runtime.hooks.afterReady.tap(SlideTemplate, ({ pages }) => {
    for (const page of pages) {
      if (page.type !== 'post' || page.data.post.data.template !== 'slide') {
        continue;
      }

      page.ensureFontBucket(
        PrimaryTitleFont.fontFamily,
        PrimaryTitleFontFile,
        { fontWeight: PrimaryTitleFont.fontWeight, fallbackFont: FontHeading },
      );
    }
  });

  runtime.hooks.beforeBuild.tapPromise(SlideTemplate, async ({ pages, rename }) => {
    await Promise.all(
      pages
        .filter((page) => page.type === 'post')
        .filter((page) => page.data.post.data.template === 'slide')
        .map((page) => {
          page
            .getFontBucket(PrimaryTitleFont.fontFamily)
            .addText(page.data.post.data.title);

          return page.buildFonts({
            families: [PrimaryTitleFont.fontFamily],
            scope: page.pathname,
            cssFileName: 'slide-fonts',
            cssMode: 'full',
            format: rename,
          });
        }),
    );
  });
});
