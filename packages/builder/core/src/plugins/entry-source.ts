import { normalize } from '@blog/node';
import type { BuilderInstance, BuilderPlugin, TransformState } from '@blog/types';
import type { Loader } from 'esbuild';
import { appendInlineMap } from '../utils/sourcemap';

const sources = new WeakMap<BuilderInstance, TransformState>();
const pluginName = 'entry-source';

/** 子构建只接收入口内容；其他依赖仍由自己的 load / transform 处理。 */
export const EntrySource = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.load.tap(pluginName, (args) => {
        const source = sources.get(builder);

        if (!source || args.namespace !== 'file' || normalize(args.path) !== normalize(builder.options.entry)) {
          return;
        }

        return {
          contents: appendInlineMap(source, { ...source, map: 'identity' }),
          loader: source.format as Loader,
          resolveDir: source.resolveDir,
          source: { sourcePath: source.module.sourcePath, format: source.format },
        };
      });
    });
  },
});

export function setEntrySource(builder: BuilderInstance, source?: TransformState) {
  const previous = sources.get(builder);

  if (source) {
    sources.set(builder, source);
  }
  else {
    sources.delete(builder);
  }

  if (
    previous?.code !== source?.code
    || previous?.format !== source?.format
    || previous?.resolveDir !== source?.resolveDir
    || previous?.module.sourcePath !== source?.module.sourcePath
    || JSON.stringify(previous?.map) !== JSON.stringify(source?.map)
  ) {
    // 磁盘文件没变，前序 transform 的输出也可能改变。
    builder.addWatchFiles(builder.options.entry);
    builder.setChangeFiles(builder.options.entry);
  }
}
