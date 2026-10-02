/** mdx 文件匹配 */
export const mdxMatcher = /\.mdx?$/;

let i = 0;

/** 将文章组件与命名导出组合为 @blog/posts 中的一项。 */
export function getImportCode(path: string, exportName: string) {
  const index = i++;

  return `
import post_${index}_default, * as post_${index}_utils from '${path}';
const ${exportName} = {
  Component: post_${index}_default,
  ...post_${index}_utils,
};
`.trimStart();
}

export function getPostsInputCode(posts: string[]) {
  let code = '';

  for (let i = 0; i < posts.length; i++) {
    code += getImportCode(posts[i], `post_${i}`);
  }

  code += `\nconst posts = [
  ${Array(posts.length)
    .fill(0)
    .map((_, i) => `post_${i}`)
    .join(', ')}
];

export default posts;
`;

  return code;
}
