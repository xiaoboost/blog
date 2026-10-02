import type { Mdx } from '@blog/types';
import type { Plugin } from 'unified';
import { createExport, createJsonExpression } from '../ast/mdx';

/** 保存 remark 阶段的文章树；快照不包含 data 自身，也不受后续 MDX 转换影响。 */
export const remarkPostData: Plugin<[], Mdx.Root> = () => (tree, file) => {
  // 与资源插件一致，仅在收到文章配置时导出文章数据。
  if (typeof file.data.template !== 'string') return;

  const json = JSON.stringify({ ...file.data, ast: tree });
  tree.children.push(createExport('data', createJsonExpression(JSON.parse(json)), json));
};
