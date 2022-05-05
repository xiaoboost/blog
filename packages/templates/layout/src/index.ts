import assets from './index.script';

export * from './views/main-index';
export * from './views/post-list';
// export * from './views/tag-list';
// export * from './views/year-list';

export const createAssets: CreateAssets = () => {
  assets;
  return Promise.resolve([]);
};
