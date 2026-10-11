import { readFile } from 'fs/promises';
import { dirname, isAbsolute } from 'path';
import type {
  BuilderInstance,
  BundlerHooks,
  ModuleLoadResult,
  ModuleInfo,
  Mode,
  TransformContext,
  TransformState,
} from '@blog/types';
import type {
  BuildOptions,
  Loader,
  OnLoadArgs,
  OnLoadResult,
} from 'esbuild';
import { appendInlineMap, composeMaps, readSourceMap } from '../utils/sourcemap';
import {
  defaultFormat,
  loaders,
  validateSourcePath,
} from './utils';

/** 取得模块内容，执行转换管道，再生成 esbuild 的加载结果。 */
export async function loadAndTransform(
  builder: BuilderInstance,
  hooks: BundlerHooks,
  args: OnLoadArgs,
  options: BuildOptions,
): Promise<OnLoadResult | undefined> {
  const files = new Set<string>();
  const dirs = new Set<string>();

  try {
    const source = await load(hooks, args, options, files);

    if (source === undefined) {
      return;
    }

    const transformResult = await transform(builder.options.mode, hooks, args, source, files, dirs);
    const result = {
      ...transformResult,
      ...(files.size ? { watchFiles: [...files] } : {}),
      ...(dirs.size ? { watchDirs: [...dirs] } : {}),
    };
    await hooks.loadResult.promise(result, args);
    return result;
  }
  finally {
    // 即使转换抛错，也保留已发现的依赖，修正文件后可以重试。
    builder.addWatchFiles(...files);
    builder.addWatchDirs(...dirs);
  }
}

/** 读取源码 */
async function load(
  hooks: BundlerHooks,
  args: OnLoadArgs,
  options: BuildOptions,
  files: Set<string>,
): Promise<ModuleLoadResult | undefined> {
  const loaded = await hooks.load.promise(args);

  if (loaded != null) {
    return loaded;
  }

  if (args.namespace !== 'file') {
    return;
  }

  // 无转换时仍使用 esbuild 原生读取；显式的 file / dataurl 等资源 loader 也旁路。
  const format = hooks.transform.taps.length ? defaultFormat(args.path, options) : undefined;

  if (!format) {
    return;
  }

  files.add(args.path);
  validateSourcePath(args.path);
  return {
    contents: await readFile(args.path, 'utf8'),
    resolveDir: dirname(args.path),
    source: { sourcePath: args.path, format },
  };
}

/** 源码转换管道 */
async function transform(
  mode: Mode,
  hooks: BundlerHooks,
  args: OnLoadArgs,
  loaded: ModuleLoadResult,
  files: Set<string>,
  dirs: Set<string>,
): Promise<OnLoadResult> {
  const { source, ...result } = loaded;
  result.watchFiles?.forEach((path) => files.add(path));
  result.watchDirs?.forEach((path) => dirs.add(path));
  validateSourcePath(source?.sourcePath);

  if (source?.sourcePath) {
    files.add(source.sourcePath);
  }

  if (result.errors?.length || result.contents === undefined) {
    return result;
  }

  const format = source?.format ?? loaders[`.${result.loader ?? 'js'}`];

  if (!hooks.transform.taps.length || !format) {
    return result;
  }

  const addDependency = (target: Set<string>, path: string) => {
    if (!isAbsolute(path)) {
      throw new Error(`依赖必须使用绝对路径：${path}`);
    }

    target.add(path);
  };
  const module: ModuleInfo = {
    id: args,
    sourcePath: source?.sourcePath,
  };
  const code = typeof result.contents === 'string'
    ? result.contents
    : Buffer.from(result.contents).toString('utf8');
  const input: TransformState = {
    module,
    code,
    format,
    resolveDir: result.resolveDir,
    map: await readSourceMap(code, source?.sourcePath, result.resolveDir, files),
  };
  const context: TransformContext = {
    mode,
    update: (input, change) => Object.freeze({
      ...input,
      code: change.code,
      format: change.format ?? input.format,
      resolveDir: change.resolveDir ?? input.resolveDir,
      map: composeMaps(input.map, change.map),
    }),
    addWatchFile: (path) => addDependency(files, path),
    addWatchDir: (path) => addDependency(dirs, path),
  };
  const output = await hooks.transform.promise(input, context);

  return {
    ...result,
    contents: appendInlineMap(output, input),
    loader: output.format as Loader,
    resolveDir: output.resolveDir,
  };
}
