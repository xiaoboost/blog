import type { AssetData } from '@blog/types';
import { forEach, RuntimeBuilder as Builder, replaceAsset } from '@blog/context/runtime';
import {
  SiteTitleFontBucket,
  ListTitleFontBucket,
  ListItemTitleFontBucket,
} from './constant/title';
import exportAssets from './layout.script';

forEach((runtime) => {
  runtime.hooks.afterPreBuild.tapPromise('layout:title-font', async (assets) => {
    const minify = Builder.options.mode === 'production';
    const fonts = [SiteTitleFontBucket, ListTitleFontBucket, ListItemTitleFontBucket];

    // 最小化字体文件
    await Promise.all(
      fonts.map((font) =>
        font.build({
          minify,
          rename: (asset: AssetData) => Builder.renameAsset(asset) ?? asset.path,
        }),
      ),
    );

    const layoutStyles = assets.find((asset) => {
      return /layout(\.[a-f0-9]{32})?\.css$/.test(asset.path);
    });

    if (!layoutStyles) {
      Builder.logger.info('layout 样式文件未找到，跳过字体文件注入');
      return assets;
    }

    const layoutStylesContent = layoutStyles.content.toString('utf-8');
    const newLayoutStyleBuffer = Buffer.from(
      layoutStylesContent.trim() +
        SiteTitleFontBucket.getFontFaceCss().trim() +
        ListTitleFontBucket.getFontFaceCss().trim() +
        ListItemTitleFontBucket.getFontFaceCss().trim(),
    );
    const newLayoutStylePath = Builder.renameAsset({
      path: layoutStyles.path.replace(/\.[a-f0-9]{32}/, ''),
      content: newLayoutStyleBuffer,
    });

    if (!newLayoutStylePath) {
      Builder.logger.info('生成新的 Layout 样式文件失败，跳过字体文件注入');
      return assets;
    }

    const newLayoutStyleFile = {
      content: newLayoutStyleBuffer,
      path: newLayoutStylePath,
    };

    // 替换导出资源
    replaceAsset(exportAssets, layoutStyles.path, newLayoutStylePath);

    // 返回新的资源列表
    return assets
      .filter((asset) => asset.path !== layoutStyles.path)
      .concat(newLayoutStyleFile, ...fonts.map((font) => font.getFont()));
  });
});
