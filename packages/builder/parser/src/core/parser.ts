import type { ErrorData, PostBasicData, PostMeta, Mdx as MdxAst } from '@blog/types';
import { format as formatCode } from 'prettier';
import type { PluggableList } from 'unified';
import { remarkTsCodeBlock } from '../plugins/code-block';
import { remarkMathComponents } from '../plugins/math';
import { remarkPostAssets } from '../plugins/post-assets';
import { remarkPostData } from '../plugins/post-data';

const pluginThen: Promise<PluggableList> = Promise.all([
  import('remark-gfm'),
  import('remark-math'),
  import('remark-cjk-friendly/parseOnly'),
]).then((val) => {
  return [
    ...val.map((i) => i.default),
    remarkMathComponents,
    remarkTsCodeBlock,
    remarkPostAssets,
    remarkPostData,
  ];
});

const compilerThen = import('@mdx-js/mdx');

/** parse 和 compile 共用语法配置，内置 remark 插件在这里统一注册。 */
async function createProcessor() {
  const [compiler, plugins] = await Promise.all([compilerThen, pluginThen]);
  return compiler.createProcessor({
    format: 'mdx',
    jsx: true,
    outputFormat: 'program',
    remarkPlugins: plugins,
  });
}

function parsingError(err: any, filePath: string, content: string): ErrorData {
  const position = err.place ?? err.position;
  return {
    project: 'UNKNOWN',
    name: err.source,
    message: err.message,
    filePath,
    codeFrame: position
      ? {
        content,
        range: 'start' in position ? position : { start: position, end: position },
      }
      : undefined,
  };
}

/** 编译代码到 JS：正文只解析一次，所有 AST 修改均在同一次处理内完成。 */
export async function compile(
  code: string, format = false, data: Partial<Omit<PostBasicData, 'ast'>> = {},
) {
  const { filePath } = data;
  const processor = await createProcessor();
  try {
    const compiled = await processor.process({ path: filePath, value: code, data });
    const jsxCode = compiled.toString();
    return format ? await formatCode(jsxCode, { parser: 'babel' }) : jsxCode;
  }
  catch (err: any) {
    throw filePath ? parsingError(err, filePath, code) : err;
  }
}

/** 仅解析语法，不执行 remark 转换，也不生成 JS。 */
export async function parse(filePath: string, content: string, data: Partial<PostMeta> = {}) {
  const parser = await createProcessor();

  try {
    const file = { path: filePath, value: content, data };
    return parser.parse(file) as MdxAst.Root;
  }
  catch (err: any) {
    throw parsingError(err, filePath, content);
  }
}
