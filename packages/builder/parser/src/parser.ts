import type { ErrorData, Parser, Mdx as MdxAst } from '@blog/types';
import type * as Mdx from '@mdx-js/mdx';

import { format as formatCode } from 'prettier';
import { decodeTemplate } from './template';

const parserThen: Promise<Parser> = Promise.all([
  import('unified'),
  import('remark-mdx'),
  import('remark-parse'),
  import('remark-stringify'),
]).then(([
  { unified },
  { default: mdx },
  { default: parse },
  { default: stringify },
]) => {
  return unified().use(parse).use(stringify).use(mdx);
});

const pluginThen: Promise<any[]> = Promise.all([eval("import('remark-gfm')")]).then((val) => {
  return val.map((i) => i.default);
});

const compilerThen: Promise<typeof Mdx> = eval("import('@mdx-js/mdx')");

/** 编译代码到 JS */
export async function compile(code: string, format = false) {
  const [compiler, plugins] = await Promise.all([compilerThen, pluginThen]);
  const compiled = await compiler.compile(code, {
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
