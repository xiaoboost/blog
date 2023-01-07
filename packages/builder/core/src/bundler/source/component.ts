import type { PostsExportType } from '@blog/types';
import { renderSpacePost } from './post';

export async function componentReady(posts: PostsExportType) {
  await renderSpacePost(posts);
}
