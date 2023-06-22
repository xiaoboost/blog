import type { BuilderInstance } from '@blog/types';
import { getGlobalContext, GlobalKey } from './constant';

const builderOutside = getGlobalContext()[GlobalKey.Builder];

export type RuntimeBuilder = Readonly<
  Pick<BuilderInstance, 'options' | 'resolve' | 'renameAsset' | 'emitAsset'>
>;

/**
 * 运行时构建器实例
 *
 * @description 运行时可用的构建器实例，此实例并非原始构建实例
 */
export const Builder: RuntimeBuilder = {
  options: {
    ...(builderOutside?.options ?? {}),
  },
  resolve(request, opt) {
    return builderOutside.resolve(request, opt);
  },
  renameAsset(file) {
    return builderOutside.renameAsset(file);
  },
  emitAsset(...files) {
    return builderOutside.emitAsset(...files);
  },
};
