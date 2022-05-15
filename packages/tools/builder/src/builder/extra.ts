import { site } from '../utils';

/** 获取额外静态资源 */
export function getExtraAssets(): Promise<AssetData[]> {
  return Promise.resolve([
    {
      path: '/CNAME',
      content: site.cname,
    },
  ]);
}
