import assets = require('./post.script');

import { getAssetContents, getAssetPaths } from '@blog/shared/node';

export { Post, PostProps } from './post';

export const createAssets: CreateAssets = () => {
  return getAssetContents(assets);
};

export const getAssetNames: GetAssetNames = () => {
  return getAssetPaths(assets);
};
