declare module '@blog/posts' {
  import { PostMeta } from 'src/bundler/plugins/loader-post/types';
  const data: PostMeta[];
  export default data;
}
