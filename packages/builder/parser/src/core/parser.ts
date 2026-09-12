import type { ErrorData, Parser, Mdx as MdxAst } from '@blog/types';
import { format as formatCode } from 'prettier';
import type { PluggableList } from 'unified';
import { replaceMath } from '../plugins/math';
import { decodeTemplate } from './image-template';

const parserThen: Promise<Parser> = Promise.all([
  import('unified'),
  import('remark-mdx'),
  import('remark-parse'),
  import('remark-stringify'),
  import('remark-math'),
]).then(([
  { unified },
  { default: mdx },
  { default: parse },
  { default: stringify },
  { default: math },
]) => {
  return unified().use(parse).use(stringify).use(mdx).use(math);
});

const pluginThen: Promise<PluggableList> = Promise.all([import('remark-gfm')]).then((val) => {
  return val.map((i) => i.default);
});

const compilerThen = import('@mdx-js/mdx');

/** 编译代码到 JS */
export async function compile(code: string, format = false) {
  const [compiler, plugins] = await Promise.all([compilerThen, pluginThen]);
  const compiled = await compiler.compile(await transformMath(code), {
    format: 'mdx',
    jsx: true,
    outputFormat: 'program',
    remarkPlugins: plugins,
  });

  let jsxCode = compiled.toString();

  if (format) {
    jsxCode = await formatCode(jsxCode, {
      parser: 'babel',
    });
  }

  return decodeTemplate(jsxCode);
}

/** 让公式复用自定义组件的渲染与按文章收集资源流程。 */
export async function transformMath(content: string, fileName = 'math.mdx') {
  return replaceMath(content, await parse(fileName, content));
}

/** 代码转为 AST */
export async function parse(fileName: string, content: string) {
  const parser = await parserThen;

  try {
    return parser.parse(content) as MdxAst.Root;
  }
  catch (err: any) {
    const data: ErrorData = {
      project: 'UNKNOWN',
      name: err.source,
      message: err.message,
      filePath: fileName,
      codeFrame: {
        content,
        range: err.position,
      },
    };

    throw data;
  }
}
