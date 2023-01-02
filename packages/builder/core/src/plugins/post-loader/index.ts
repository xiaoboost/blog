import type { BuilderPlugin } from '@blog/types';
import { MdxLoader } from './mdx';
import { PostsLoader } from './posts';

const pluginName = 'blog-posts-loader';

export const PostLoader = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    MdxLoader().apply(builder);
    PostsLoader().apply(builder);
  },
});
