/* eslint-disable no-eval */

// @ts-ignore
import type Mdx from '@mdx-js/mdx';

import prettier from 'prettier';
import { ErrorData, Parser, Mdx as MdxAst } from '@blog/types';
import { decodeTemplate } from './template';

const parserThen: Promise<Parser> = Promise.all([
  eval("import('unified')"),
  eval("import('remark-mdx')"),
  eval("import('remark-parse')"),
  eval("import('remark-stringify')"),
]).then(([{ unified }, mdx, parse, stringify]) => {
  return unified().use(parse.default, { position: false }).use(stringify.default).use(mdx.default);
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
    jsxCode = await prettier.format(jsxCode, {
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
  } catch (err: any) {
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
