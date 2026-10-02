import { compile } from '../core/parser';
import { getPostData } from './metadata';

/** POST 文章编译 */
export async function transform(content: string, fileName: string, format = false) {
  const { content: mdxCode, ...data } = await getPostData(content, fileName);
  return await compile(mdxCode, format, data);
}
