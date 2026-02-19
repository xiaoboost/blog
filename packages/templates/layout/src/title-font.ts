import { forEach, RuntimeBuilder as Builder } from '@blog/context/runtime';
import { TitleFontBucket } from './utils/font';
import TitleFontFile from './assets/font/dancing/dancing.ttf';

forEach((runtime) => {
  TitleFontFile;

  Builder.getCacheAccessor();

  debugger;
  runtime.hooks.afterPreBuild.tapPromise('layout:title-font', async () => {
    await TitleFontBucket.build({
      publicPath: Builder.options.publicPath,
      minify: Builder.options.mode === 'production',
    });

    debugger;
    const titleFont = TitleFontBucket.getFont();
    const titleFontCss = TitleFontBucket.getCss();

    debugger;
  });
});
