import { site } from '@blog/config';
import { AssetData } from '@blog/utils';

export const assets: AssetData[] = [{
  path: 'CNAME',
  contents: site.cname,
}];
