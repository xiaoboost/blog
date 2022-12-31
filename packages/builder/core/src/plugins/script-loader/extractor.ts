import type { BuilderPlugin, BundlerInstance } from '@blog/types';
import path from 'path';
import md5 from 'md5';
// TODO: getNameCreator 的优化，合并 normalize，以及加入 ext 选项
import { getNameCreator, normalize } from '@blog/node';
import { EntrySuffix } from './utils';

const pluginName = 'asset-extractor';

export interface ExtractorOptions {
  scriptNames: string;
  styleNames: string;
  publicPath: string;
}

export const Extractor = (opt: ExtractorOptions): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const getStyleNames = getNameCreator(path.join(opt.publicPath, opt.styleNames));
    const getScriptNames = getNameCreator(path.join(opt.publicPath, opt.scriptNames));
    const chunkName = path.basename(builder.options.entry).replace(EntrySuffix, '');

    let bundler: BundlerInstance;

    builder.hooks.bundler.tap(pluginName, (_bundler) => {
      bundler = _bundler;
    });

    builder.hooks.runner.tap(pluginName, (runner) => {
      // 忽略运行器
      runner.run = () => Promise.resolve();
    });

    builder.hooks.processAssets.tap(pluginName, (assets) => {
      const result = assets.slice();
      const bundlerAssets = bundler.getAssets();
      const styleFile = bundlerAssets.find((item) => item.path.endsWith('.css'));
      const styleMapFile = bundlerAssets.find((item) => item.path.endsWith('.css.map'));
      const scriptFile = bundlerAssets.find((item) => item.path.endsWith('.js'));
      const scriptMapFile = bundlerAssets.find((item) => item.path.endsWith('.js.map'));

      if (styleFile) {
        const hash = md5(styleFile.content);
        const basename = getStyleNames({
          name: chunkName,
          hash,
        });

        styleFile.path = normalize(
          path.format({
            name: basename,
            ext: '.css',
          }),
        );

        result.push(styleFile);

        if (styleMapFile) {
          result.push(styleMapFile);
          styleMapFile.path = normalize(
            path.format({
              name: basename,
              ext: '.css.map',
            }),
          );
        }
      }

      if (scriptFile) {
        const code = scriptFile.content.toString('utf-8');

        // 跳过空文件
        if (!/^\(\(\)\s*=>\s*\{\s*\}\)\(\);\s*$/.test(code)) {
          const hash = md5(scriptFile.content);
          const basename = getScriptNames({
            name: chunkName,
            hash,
          });

          scriptFile.path = normalize(
            path.format({
              name: basename,
              ext: '.js',
            }),
          );

          result.push(scriptFile);

          if (scriptMapFile) {
            result.push(scriptMapFile);
            scriptMapFile.path = normalize(
              path.format({
                name: basename,
                ext: '.js.map',
              }),
            );
          }
        }
      }

      return result;
    });
  },
});
