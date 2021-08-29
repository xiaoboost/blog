import { AssetData } from '@blog/utils';
import { PostData } from '@blog/posts';
import { createHtml } from './utils';
import { Post as Render } from '@blog/template-post';

const renderHtml = createHtml(Render);

function getModules(post: PostData) {
  // ..
}

function getPostHtml(post: PostData) {
  // ..
}

function getRefLink(name: string) {
  // ..
}

function build(posts: PostData[]): AssetData[] {
  const assets: AssetData[] = [];

  for (const post of posts) {
    const moduleRefs = getModules(post);
  }

  return assets;
}
