import { forEach, RuntimeBuilder as Builder, getAccessor } from '@blog/context/runtime';
import { FontBucket, normalize } from '@blog/node';
import FirstTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';
import SecondTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-SemiBold.otf?raw';
import { PostTemplate, FirstTitleFontFamily, SecondTitleFontFamily } from './constant';
import { createNavFromAst, flattenNavTitles } from './to-content';

forEach((runtime) => {
  runtime.hooks.beforeEachPost.tapPromise(PostTemplate, async (post) => {
    const minify = Builder.options.mode === 'production';
    const firstTitleFontBucket = getAccessor(
      `${post.data.pathname}:${FirstTitleFontFamily}`,
      () =>
        new FontBucket({
          fontContent: FirstTitleFontFile,
          fontFamily: FirstTitleFontFamily,
          fontFile: normalize(`${post.data.pathname}/fonts/primary.woff2`),
          rename: (asset) => Builder.renameAsset(asset) ?? asset.path,
          minify,
        }),
    ).get();
    const secondTitleFontBucket = getAccessor(
      `${post.data.pathname}:${SecondTitleFontFamily}`,
      () =>
        new FontBucket({
          fontContent: SecondTitleFontFile,
          fontFamily: SecondTitleFontFamily,
          fontFile: normalize(`${post.data.pathname}/fonts/secondary.woff2`),
          rename: (asset) => Builder.renameAsset(asset) ?? asset.path,
          minify,
        }),
    ).get();
    const titles = flattenNavTitles(createNavFromAst(post.data.ast, 6));

    firstTitleFontBucket.addText(post.data.title);

    for (const title of titles) {
      if (title.level === 1) {
        firstTitleFontBucket.addText(title.content);
      } else {
        secondTitleFontBucket.addText(title.content);
      }
    }

    const fonts = [firstTitleFontBucket, secondTitleFontBucket].filter((font) => !font.isEmpty);
    await Promise.all(fonts.map((font) => font.build()));

    const cssFile = fonts.map((font) => font.getFontFaceCss()).join('');
    const cssBuffer = Buffer.from(cssFile);
    const cssPath = Builder.renameAsset({
      path: normalize(`${post.data.pathname}/styles/heading.css`),
      content: cssBuffer,
    });

    if (!cssPath) {
      Builder.logger.info('生成新的 Title 样式文件失败，跳过字体文件注入');
      return;
    }

    // 添加 CSS 资源
    post.utils.addAssetNames(cssPath);
    Builder.emitAsset({ path: cssPath, content: cssBuffer });
    // 添加字体资源
    fonts.forEach((font) => {
      const fontAsset = font.getFont();
      post.utils.addAssetNames(fontAsset.path);
      Builder.emitAsset(fontAsset);
    });
  });
});
