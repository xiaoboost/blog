import { site } from '@blog/config';
import { AssetData } from '@blog/utils';

export function build(): AssetData[] {
  return [
    {
      path: 'CNAME',
      contents: site.cname,
    },
  ];
}
