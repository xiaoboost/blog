import type {
  DefineUtilsOptions,
  PreloadAssetData,
  ScriptAssetData,
  StyleAssetData,
  TemplateAsset,
  TemplateScriptAsset,
  TemplateUtils,
} from '@blog/types';
import { mergeBrowserConfig } from '../browser-config';

const isScriptPath = (path: string) => path.split(/[?#]/)[0].endsWith('.js');
const isStylePath = (path: string) => path.split(/[?#]/)[0].endsWith('.css');
const copyReference = (asset: TemplateAsset): TemplateAsset => (
  typeof asset === 'string' ? asset : { ...asset }
);
const getPath = (asset: TemplateAsset): string => (
  typeof asset === 'string' ? asset : 'src' in asset ? asset.src : asset.href
);

function getKey(asset: TemplateAsset): string {
  if (typeof asset === 'string') {
    const kind = isScriptPath(asset) ? 'script' : isStylePath(asset) ? 'style' : 'asset';
    return `${kind}:${asset}`;
  }

  if ('src' in asset) {
    return `script:${asset.src}`;
  }

  if ('as' in asset) {
    // 同一地址可以有不同的预加载条件，不能只按 href 合并。
    return `preload:${JSON.stringify([
      asset.href,
      asset.as,
      asset.type,
      asset.crossOrigin,
      asset.media,
    ])}`;
  }

  return `style:${asset.href}`;
}

/**
 * 收集模板资源引用
 */
export function defineUtils(
  assets: readonly TemplateAsset[] = [],
  { browserConfig = {} }: DefineUtilsOptions = {},
): TemplateUtils {
  const references = assets.map(copyReference);
  const getAssetReferences = (): TemplateAsset[] => {
    const result = new Map<string, TemplateAsset>();
    for (const asset of references) {
      if (process.env.NODE_ENV === 'production' && getPath(asset).endsWith('.map')) {
        continue;
      }

      const key = getKey(asset);
      const previous = result.get(key);

      if (previous === undefined || typeof previous === 'string' || typeof asset !== 'string') {
        result.set(key, asset);
      }
    }
    return [...result.values()].map(copyReference);
  };
  const getScripts = (position: 'head' | 'body'): ScriptAssetData[] => (
    getAssetReferences().flatMap((asset) => {
      if (typeof asset === 'string') {
        return position === 'body' && isScriptPath(asset) ? [{ src: asset }] : [];
      }

      if ('src' in asset) {
        const { position: target = 'body', ...script } = asset;
        return target === position ? [script] : [];
      }

      return [];
    })
  );

  return {
    getBrowserConfig: () => mergeBrowserConfig(browserConfig),
    getAssetReferences,
    getAssetNames: () => [...new Set(getAssetReferences().map(getPath))],
    getScripts: () => getScripts('body'),
    getPreScripts: () => getScripts('head'),
    getStyles: (): StyleAssetData[] => getAssetReferences().flatMap((asset) => {
      if (typeof asset === 'string') {
        return isStylePath(asset) ? [{ href: asset }] : [];
      }

      return 'href' in asset && !('as' in asset) ? [asset] : [];
    }),
    getPreloadAssets: () => getAssetReferences().filter(
      (asset): asset is PreloadAssetData => typeof asset !== 'string' && 'as' in asset,
    ),
    addAssetNames: (...items) => {
      references.push(...items);
    },
    insertAssetNames: (...items) => {
      references.unshift(...items);
    },
    addPreloadAssets: (...items) => {
      references.push(...items.map(copyReference));
    },
    replaceAssetName: (oldAsset, newAsset) => {
      references.forEach((asset, index) => {
        if (getPath(asset) !== oldAsset) {
          return;
        }

        references[index] = typeof asset === 'string'
          ? newAsset
          : 'src' in asset ? { ...asset, src: newAsset } : { ...asset, href: newAsset };
      });
    },
  };
}

/** 合并资源配置 */
export function mergeUtils(...utils: TemplateUtils[]): TemplateUtils {
  return defineUtils(utils.flatMap((item) => item.getAssetReferences()), {
    browserConfig: mergeBrowserConfig(...utils.map((item) => item.getBrowserConfig())),
  });
}

/** 配置一组产物 */
export function withScriptOptions(
  assets: readonly string[],
  options: Omit<TemplateScriptAsset, 'src'>,
): TemplateAsset[] {
  return assets.map((path) => isScriptPath(path) ? { ...options, src: path } : path);
}
