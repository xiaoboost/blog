import type { BuilderPlugin } from '@blog/types';
import { applyPostAssets } from './assets';
import { MdxLoader } from './mdx';
import { PostsLoader } from './posts';
import { SlideAssets } from './slide';

const pluginName = 'blog-posts-loader';

export const PostLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    applyPostAssets(builder);
    SlideAssets().apply(builder);
    MdxLoader().apply(builder);
    PostsLoader().apply(builder);
  },
});
