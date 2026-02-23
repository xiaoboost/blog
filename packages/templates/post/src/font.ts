import { forEach, RuntimeBuilder as Builder, getAccessor } from '@blog/context/runtime';
import { FontBucket, normalize } from '@blog/node';
import FirstTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';
import SecondTitleFontFile from '@blog/styles/fonts/SourceHanSerif/SourceHanSerifSC-SemiBold.otf?raw';
import { PostTemplate, FirstTitleFontFamily, SecondTitleFontFamily } from './constant';
import { getNavList } from './to-content';

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
    const titles = getNavList(post.data.ast);

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

    // 所有资源
    const assets = [
      {
        path: cssPath,
        content: cssBuffer,
      },
      ...fonts.map((font) => font.getFont()),
    ];

    assets.forEach((asset) => {
      // 资源添加到输出
      Builder.emitAsset({ path: asset.path, content: asset.content });
      // 当前资源添加到依赖
      post.utils.addAssetNames(asset.path);
    });
  });
});
