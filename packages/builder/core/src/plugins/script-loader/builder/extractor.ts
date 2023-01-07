import type { BuilderPlugin } from '@blog/types';
import path from 'path';
import md5 from 'md5';
import { getPathFormatter } from '@blog/node';
import { getAssetNames } from '../../file-loader';
import { EntrySuffix } from '../utils';

const pluginName = 'asset-extractor';

export const AssetExtractor = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { mode, publicPath, entry },
    } = builder;
    const isProduction = mode === 'production';
    const getStyleNames = getPathFormatter(
      path.join(publicPath, getAssetNames('styles', isProduction)),
    );
    const getScriptNames = getPathFormatter(
      path.join(publicPath, getAssetNames('scripts', isProduction)),
    );
    const chunkName = path.basename(entry).replace(EntrySuffix, '');

    // TODO: 部分 template 和组件是合并的，此时如何处理

    builder.hooks.runner.tap(pluginName, (runner) => {
      // 忽略运行器
      runner.run = () => Promise.resolve();
    });

    builder.hooks.afterBundler.tap(pluginName, ({ bundler }) => {
      const assets = bundler.getAssets();
      const styleFile = assets.find((item) => item.path.endsWith('.css'));
      const styleMapFile = assets.find((item) => item.path.endsWith('.css.map'));
      const scriptFile = assets.find((item) => item.path.endsWith('.js'));
      const scriptMapFile = assets.find((item) => item.path.endsWith('.js.map'));

      if (styleFile) {
        const hash = md5(styleFile.content);

        builder.emitAsset({
          content: styleFile.content,
          path: getStyleNames({
            name: chunkName,
            ext: '.css',
            hash,
          }),
        });

        if (styleMapFile) {
          builder.emitAsset({
            content: styleMapFile.content,
            path: getStyleNames({
              name: chunkName,
              ext: '.css.map',
              hash,
            }),
          });
        }
      }

      if (scriptFile) {
        const code = scriptFile.content.toString('utf-8');

        // 跳过空文件
        if (!/^\(\(\)\s*=>\s*\{\s*\}\)\(\);\s*$/.test(code)) {
          const hash = md5(scriptFile.content);

          builder.emitAsset({
            content: scriptFile.content,
            path: getScriptNames({
              name: chunkName,
              ext: '.js',
              hash,
            }),
          });

          if (scriptMapFile) {
            builder.emitAsset({
              content: scriptMapFile.content,
              path: getScriptNames({
                name: chunkName,
                ext: '.js.map',
                hash,
              }),
            });
          }
        }
      }
    });
  },
});
