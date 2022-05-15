declare module '@blog/posts' {
  import { PostRendered } from 'src/bundler/plugins/loader-post/types';
  const data: PostRendered[];
  export default data;
}
