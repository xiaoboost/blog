import type { BuilderInstance } from '@blog/types';
import { getGlobalContext, GlobalKey } from './constant';

const builderOutside = getGlobalContext()[GlobalKey.Builder];

export type RuntimeBuilder = Readonly<
  Pick<
    BuilderInstance,
    'options' | 'resolve' | 'renameAsset' | 'emitAsset' | 'logger' | 'getCacheAccessor'
  >
>;

/**
 * 运行时构建器实例
 *
 * @description 运行时可用的构建器实例，此实例并非原始构建实例
 */
export const RuntimeBuilder: RuntimeBuilder =
  process.env.NODE_ENV === 'test'
    ? ({} as RuntimeBuilder)
    : {
        options: {
          ...builderOutside.options,
        },
        logger: {
          debug: builderOutside.logger.debug.bind(builderOutside.logger),
          info: builderOutside.logger.info.bind(builderOutside.logger),
          error: builderOutside.logger.error.bind(builderOutside.logger),
        },
        getCacheAccessor(name: string) {
          return builderOutside.getCacheAccessor(name);
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
