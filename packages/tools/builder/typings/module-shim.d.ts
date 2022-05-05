declare module '@blog/posts' {
  import { PostMeta } from 'src/bundler/esbuild/loader-post/types';
  const data: PostMeta[];
  export default data;
}
