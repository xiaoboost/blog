import { getComponentAssets, componentReady } from './component';
import { getExtraAssets } from './extra';
import { getPostAssets, runPostComponent } from './post';
import { getListAssets } from './list';

import { mergeAssetContents } from '@blog/shared/node';

export default async function build() {
  await componentReady();
  runPostComponent();

  // 组件静态资源生成必须在前面
  const components = await getComponentAssets();
  const assets = await mergeAssetContents(getExtraAssets(), getPostAssets(), getListAssets());

  return components.concat(assets);
}
