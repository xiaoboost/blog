import { AssetData } from '@blog/utils';
import { createHtml } from './utils';
import { Post as Render } from '@blog/template-post';
import { default as posts, PostRendered } from '@blog/posts';

const renderHtml = createHtml(Render);

function getModules(post: PostRendered) {
  // ..
}

function getPostHtml(post: PostRendered) {
  // ..
}

function getRefLink(name: string) {
  // ..
}

export function build(): AssetData[] {
  const assets: AssetData[] = [];

  for (const post of posts) {
    const moduleRefs = getPostHtml(post);
  }

  return assets;
}
