import { parse as parseYaml } from 'yaml';
import type { PostMeta, PostData } from '@blog/types';
import { toPinyin, normalize } from '@blog/node';
import { Fixer } from '@blog/shared';
import { stat } from 'fs/promises';
import { join } from 'path';

import { parse, compile } from './parser';
import { addTemplateUtilsExport, addPostAssetImport } from './utils';

function getDateByDay(input: string) {
  const date = new Date(input);
  date.setUTCHours(8, 0, 0, 0);
  return date.getTime();
}

/** 获取元数据 */
export function getPostMetaData(content: string, fileName: string) {
  const result = content.match(/^---([\d\D]+?)---([\d\D]*)$/);

  if (!result) {
    throw {
      message: `文件格式错误: ${fileName}`,
    };
  }

  const [, metaStr, mdContent] = result;
  const meta = parseYaml(metaStr) as PostMeta;

  meta.content = mdContent.trim();

  if (!meta) {
    throw {
      message: `文章属性解析失败: ${fileName}`,
    };
  }

  // 检查必填属性
  const required = (['title', 'create'] as const).filter((key) => !meta[key]);

  if (required.length > 0) {
    throw {
      message: `文章必须要有 ${required.join(', ')} 字段：${fileName}`,
    };
  }

  return meta;
}

/** 获取文章数据 */
export async function getPostData(content: string, fileName: string) {
  const meta = getPostMetaData(content, fileName);
  const postContent = (meta.content ?? '').trim();
  const createAt = new Date(meta.create).getFullYear().toString();
  const decodeTitle = toPinyin(meta.title).toLowerCase();
  const data: PostData = {
    title: meta.title,
    create: getDateByDay(meta.create),
    update: meta.update ? getDateByDay(meta.update) : (await stat(fileName)).mtimeMs,
    tags: (meta.tags ? (Array.isArray(meta.tags) ? meta.tags : [meta.tags]) : []).map((name) => ({
      name,
      url: '',
    })),
    public: meta.public ?? true,
    content: postContent,
    filePath: normalize(fileName),
    pathname: meta.pathname
      ? normalize(meta.pathname)
      : normalize(join('posts', createAt, decodeTitle)),
    toc: meta.toc ?? true,
    ast: await parse(fileName, postContent),
    template: meta.template ?? 'post',
    description:
      meta.description ??
      meta.content
        .trim()
        .slice(0, 200)
        .replace(/[\n\r]/g, ''),
  };
  const fixer = new Fixer(data.content);

  addPostAssetImport(data, fixer);
  addTemplateUtilsExport(data, fixer);

  data.content = fixer.apply();
  data.ast = await parse(`${fileName}.js`, data.content);

  return data;
}

/** POST 文章编译 */
export async function transform(content: string, fileName: string, format = false) {
  const { content: mdxCode, ...data } = await getPostData(content, fileName);
  const renderCode = await compile(mdxCode, format);
  return `${renderCode};\n;\nexport const data = ${JSON.stringify(data, null, 2)}`;
}

let i = 0;

/** 生成引用文章代码 */
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
