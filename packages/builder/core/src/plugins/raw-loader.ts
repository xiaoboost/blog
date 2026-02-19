import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { normalize } from '@blog/node';
import { parsePath } from '../utils';

const pluginName = 'raw-loader';

export interface RawLoaderOption {
  /**
   * 资源匹配规则
   *
   * @example /\.(woff|woff2|ttf)$/
   */
  test: RegExp;
}

export const RawLoader = ({ test }: RawLoaderOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        const { basic, query } = parsePath(args.path);

        // 仅处理带有 ?raw 查询参数，且命中 test 规则的请求
        if (!query.raw || !test.test(basic)) {
          return;
        }

        // 去掉查询参数做一次正常解析
        const resolved = builder.resolve(basic, args);
        const filePath = normalize(resolved.path);

        // 交给本插件的 namespace，在 load 阶段注入运行时代码
        return {
          ...resolved,
          path: filePath,
          namespace: pluginName,
          watchFiles: [filePath],
        };
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        const file = args.path;
        // 使用文件路径作为缓存 key 的一部分，确保唯一性
        const cacheKey = `raw-loader::${file}`;
        const code = `
import { readFileSync } from "fs";
import { getAccessor } from "@blog/context/runtime";

const cacheKey = ${JSON.stringify(cacheKey)};
const filePath = ${JSON.stringify(file)};
const accessor = getAccessor(cacheKey, () => readFileSync(filePath));

export default accessor.get() ?? readFileSync(filePath);
        `.trim();

        return {
          contents: code,
          loader: 'js',
          resolveDir: dirname(file),
        };
      });
    });
  },
});
