// 独立组件
import * as katex from '@blog/mdx-katex';

// 特殊组件
import * as tsCodeBlock from '@blog/mdx-code-block-typescript';

// 模板
import * as layout from '@blog/template-layout';
import * as post from '@blog/template-post';

/** 组件准备 */
export function componentReady() {
  return tsCodeBlock.ready;
}

/** 获取模板和独立组件的静态资源 */
export async function getComponentAssets() {
  const assets = (
    await Promise.all([katex, layout, post].map((item) => item.createAssets()))
  ).reduce((ans, item) => ans.concat(item), []);

  return assets;
}
