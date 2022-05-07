import assets = require('./layout.script');

import { favicon } from './utils';
import { getAssetContents, getAssetPaths } from '@blog/shared/node';

export * from './components/layout';
export * from './views/main-index';
export * from './views/post-list';
// export * from './views/tag-list';
// export * from './views/year-list';

export const createAssets: CreateAssets = () => {
  return getAssetContents(assets, [favicon]);
};

export const getAssetNames: GetAssetNames = () => {
  return getAssetPaths(assets);
};
