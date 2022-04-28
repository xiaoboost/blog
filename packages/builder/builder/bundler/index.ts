import { build as buildExtra } from './extra';
import { build as buildPost } from './post';
import { build as buildList } from './list';
import { build as buildStatic, ready } from './chunk';

export default async function build() {
  await ready;
  return buildExtra().concat(buildPost(), buildList(), buildStatic());
}
