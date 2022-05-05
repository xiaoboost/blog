import assets from './index.script';

export * from './post';

export const createAssets: CreateAssets = () => {
  assets;
  return Promise.resolve([]);
};

export const getAssetNames: GetAssetNames = () => {
  return [];
};
