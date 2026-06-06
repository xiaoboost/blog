import type { BuilderPlugin } from '@blog/types';
import { getRenameMethod, mergeRename } from './rename';
import type { AssetRenameOption, Rename } from './types';

export type { AssetRenameRule, AssetRenameOption, Rename } from './types';

const pluginName = 'asset-rename-loader';

/**
 * 资源重命名加载器
 *
 * @description 负责将所有文件路径格式化规则注册到 builder.renameAsset，
 * 不参与 esbuild 打包流程。全局统一的重命名入口。
 */
export const AssetRenameLoader = (opt: AssetRenameOption): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const rename = getRenameMethod(builder, opt);

    builder.hooks.start.tap(pluginName, () => {
      if ('test' in builder.renameAsset) {
        builder.renameAsset = mergeRename(builder.renameAsset as Rename, rename);
      }
      else {
        builder.renameAsset = rename;
      }
    });
  },
});
