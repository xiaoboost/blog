import path from 'path';
import md5 from 'md5';

import { isArray } from '@xiao-ai/utils';
import { getPathFormatter } from '@blog/node';
import type { AssetData, BuilderInstance } from '@blog/types';
import type { FileLoaderOptionInput, Rename } from './types';

/** 安装重命名方法 */
export function getRenameMethod(builder: BuilderInstance, opt: FileLoaderOptionInput): Rename {
  const { publicPath } = builder.options;
  const options = (isArray(opt) ? opt : [opt]).map((item) => {
    const name = item.name ?? '[name].[ext]';

    return {
      name,
      test: item.test,
      getName: getPathFormatter(path.join(publicPath, name)),
    };
  });

  function getOption(file: string) {
    const pathData = path.parse(file);
    const isMap = pathData.ext === '.map';
    const baseName = isMap ? pathData.name : file;
    const matchResult = options.find(({ test }) => test.test(baseName));

    if (!matchResult) {
      return;
    }

    return {
      ...matchResult,
      parsedPath: pathData,
    };
  }

  function test(file: string) {
    return Boolean(getOption(file));
  }

  function rename(asset: AssetData) {
    const result = getOption(asset.path);

    if (!result) {
      return;
    }

    const assetPath = result.getName({
      name: result.parsedPath.name,
      // 去掉这里解析出来的第一个点字符
      ext: result.parsedPath.ext.slice(1),
      hash: md5(asset.content),
    });

    return assetPath;
  }

  rename.test = test;

  return rename;
}

export function mergeRename(...args: Rename[]): Rename {
  if (args.length === 1) {
    return args[0];
  }

  function test(file: string) {
    return args.every(({ test }) => test(file));
  }

  function rename(asset: AssetData) {
    for (const item of args) {
      const result = item(asset);

      if (result) {
        return result;
      }
    }
  }

  rename.test = test;

  return rename;
}
