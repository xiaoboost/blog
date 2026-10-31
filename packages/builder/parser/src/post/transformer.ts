import { compile } from '../core/parser';
import { getPostData } from './metadata';

/** POST 文章编译 */
export async function transform(content: string, fileName: string, format = false) {
  const { content: mdxCode, ...data } = await getPostData(content, fileName);

  let code = mdxCode;

  // 此时 pathname 已补齐默认值，资源入口直接声明自己的输出目录。
  if (data.template === 'slide') {
    let name = '__slideAssets';
    while (code.includes(name)) {
      name += '_';
    }
    const request = `assets:./**/*.{script,jss}.ts?outDir=${encodeURIComponent(data.pathname)}`;
    code = `import ${name} from ${JSON.stringify(request)};\n\n${code}`;
  }

  return await compile(code, format, data);
}
