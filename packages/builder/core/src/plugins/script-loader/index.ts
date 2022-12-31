import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { JssLoader } from '../jss-loader';
import { FileLoader } from '../file-loader';
import { parseLoader } from '../../utils';
import { Extractor } from './extractor';
import { Transformer } from './transformer';
import { EntrySuffix } from './utils';

const pluginName = 'script-loader';

export const ScriptLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const { options } = builder;
    const minify = options.mode === 'production';
    const loaderData = parseLoader(options.loader);
    const jssLoader = JssLoader({ extractCss: true });
    const assetExtractor = Extractor({
      // TODO: 待修改
      scriptNames: 'scripts/[name]',
      styleNames: 'styles/[name]',
      publicPath: options.publicPath,
    });
    const transformer = Transformer({ minify });
    // const fileLoader = FileLoader({
    //   exts: loaderData.files,
    //   assetNames: options.assetNames,
    //   publicPath: options.publicPath,
    // });

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tapPromise(pluginName, async (args) => {
        if (args.namespace !== 'file' || !EntrySuffix.test(args.path)) {
          return;
        }

        // 入口则跳过
        if (args.path === options.entry) {
          return;
        }

        const childBuilder = await builder.createChild({
          entry: args.path,
          name: 'JSS',
          watch: options.watch,
          write: false,
          logLevel: 'Silence',
          plugin: [jssLoader, assetExtractor, transformer], // , fileLoader],
        });

        await childBuilder.build();

        const assets = childBuilder.getAssets();
        debugger;
        return {
          contents: `export default [\n  ${assets.map((item) => item.path).join(',\n  ')},\n]`,
          loader: 'js',
          resolveDir: dirname(args.path),
        };
      });
    });
  },
});
